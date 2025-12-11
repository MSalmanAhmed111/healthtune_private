import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlan, UserPlanUsage } from '@entities';
import { PlanFeatureNameEnum } from '@types';
import { SubscriberType } from 'src/user/entity/user-plan.entity';

@Injectable()
export class PlanUsageService {
  private readonly logger = new Logger('PlanUsageService');

  constructor(
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
  ) {}

  private async findActivePlan(
    subscriberId: number,
    subscriberType?: SubscriberType,
  ): Promise<UserPlan | null> {
    const now = new Date();

    const query = this.userPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.usage', 'usage')
      .leftJoinAndSelect('usage.planFeatureProperty', 'planFeatureProperty')
      .leftJoinAndSelect('planFeatureProperty.feature', 'feature')
      .where('plan.subscriberId = :subscriberId', { subscriberId })
      .andWhere('plan.isSubscriptionActive = :active', { active: true })
      .andWhere('plan.startDate <= :now', { now })
      .andWhere('(plan.endDate > :now OR plan.endDate IS NULL)', { now })
      .orderBy('plan.startDate', 'DESC')
      .take(1);

    if (subscriberType) {
      query.andWhere('plan.subscriberType = :subscriberType', { subscriberType });
    }

    return await query.getOne();
  }


  async trackUsage(
    subscriberId: number,
    featureName: PlanFeatureNameEnum,
    amount: number = 1,
  ): Promise<number> {
    try {
      // Try to find user's plan first (individual subscription)
      let userPlan = await this.findActivePlan(subscriberId, SubscriberType.USER);

      // If no user plan, try organization plan
      if (!userPlan) {
        userPlan = await this.findActivePlan(subscriberId, SubscriberType.ORGANIZATION);
      }

      if (!userPlan) {
        this.logger.error(
          `[USAGE_TRACKING] No active plan found for subscriber ${subscriberId}. ` +
          `Tried USER plan first, then ORGANIZATION plan.`
        );
        throw new NotFoundException(
          `No active plan found for user/organization ${subscriberId}. ` +
          `Please ensure a valid, non-expired subscription exists.`
        );
      }

      const planType = userPlan.subscriberType === SubscriberType.USER ? 'USER' : 'ORGANIZATION';
      this.logger.debug(
        `[USAGE_TRACKING] Found ${planType} plan (ID: ${userPlan.id}, Plan: ${userPlan.plan?.name})`
      );

      // Find usage record for this feature
      const usageRecord = userPlan.usage?.find(
        u => u.planFeatureProperty?.feature?.name === featureName,
      );

      if (!usageRecord) {
        this.logger.error(
          `[USAGE_TRACKING] Feature '${featureName}' not found in plan '${userPlan.plan?.name}' ` +
          `for ${planType} ${subscriberId}`
        );
        throw new NotFoundException(
          `Usage record not found for feature ${featureName} in subscription. ` +
          `Feature may not be included in this plan.`
        );
      }

      // Verify plan hasn't expired mid-operation (extra safety check)
      if (userPlan.endDate && userPlan.endDate <= new Date()) {
        this.logger.warn(
          `[USAGE_TRACKING] Attempted usage tracking on expired plan. ` +
          `Plan ${userPlan.id} ended on ${userPlan.endDate}`
        );
        throw new Error(
          `Cannot track usage on an expired subscription (ended ${userPlan.endDate})`
        );
      }

     const result = await this.userPlanUsageRepository
        .createQueryBuilder()
        .update(UserPlanUsage)
        // Use raw SQL expression to increment atomically
        .set({
          usageCount: () => `usageCount + ${Math.floor(amount)}`,
          updatedAt: new Date(),
        })
        .where('id = :id', { id: usageRecord.id })
        .execute();

      if (!result.affected || result.affected === 0) {
        this.logger.error(
          `[USAGE_TRACKING] Failed to update usage record ${usageRecord.id} ` +
          `for feature ${featureName}`
        );
        throw new Error('Database update failed - no rows affected');
      }

      // Fetch updated record to return new count
      const updatedRecord = await this.userPlanUsageRepository.findOne({
        where: { id: usageRecord.id },
      });

      this.logger.debug(
        `[USAGE_TRACKING] Tracked usage for feature '${featureName}': ` +
        `${usageRecord.usageCount} → ${updatedRecord?.usageCount}`
      );

      return updatedRecord?.usageCount ?? 0;
    } catch (error) {
      this.logger.error(
        `[USAGE_TRACKING] Error tracking usage for feature '${featureName}': ${error.message}`
      );
      throw error;
    }
  }


  async getUsage(subscriberId: number, featureName: PlanFeatureNameEnum): Promise<number | null> {
    try {
      let userPlan = await this.findActivePlan(subscriberId, SubscriberType.USER);

      // If no user plan, check organization's plan
      if (!userPlan) {
        userPlan = await this.findActivePlan(subscriberId, SubscriberType.ORGANIZATION);
      }

      if (!userPlan) {
        this.logger.debug(`No active plan found for subscriber ${subscriberId}`);
        return null;
      }

      const usageRecord = userPlan.usage?.find(
        u => u.planFeatureProperty?.feature?.name === featureName,
      );

      return usageRecord?.usageCount ?? 0;
    } catch (error) {
      this.logger.error(
        `Error getting usage for feature '${featureName}' and subscriber ${subscriberId}: ${error.message}`
      );
      return null;
    }
  }

  async getAllUsage(subscriberId: number): Promise<
    Array<{
      featureName: string;
      usageCount: number;
      isUnlimited: boolean;
    }>
  > {
    try {
      let userPlan = await this.findActivePlan(subscriberId, SubscriberType.USER);

      // If no user plan, check organization's plan
      if (!userPlan) {
        userPlan = await this.findActivePlan(subscriberId, SubscriberType.ORGANIZATION);
      }

      if (!userPlan) {
        this.logger.debug(`No active plan found for subscriber ${subscriberId}`);
        return [];
      }

      return userPlan.usage?.map(u => ({
        featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
        usageCount: u.usageCount ?? 0,
        isUnlimited: u.planFeatureProperty?.properties?.isUnlimited ?? false,
      })) || [];
    } catch (error) {
      this.logger.error(
        `Error getting all usage for subscriber ${subscriberId}: ${error.message}`
      );
      return [];
    }
  }

  async checkUsageLimitBeforeIncrement(
    subscriberId: number,
    featureName: PlanFeatureNameEnum,
  ): Promise<{ canUse: boolean; reason?: string }> {
    try {
      // First, try user's plan (individual subscription)
      let userPlan = await this.findActivePlan(subscriberId, SubscriberType.USER);

      // If no user plan, check organization's plan
      if (!userPlan) {
        userPlan = await this.findActivePlan(subscriberId, SubscriberType.ORGANIZATION);
      }

      if (!userPlan) {
        this.logger.debug(
          `No active plan found for subscriber ${subscriberId} when checking usage limit for feature ${featureName}`
        );
        return { 
          canUse: false, 
          reason: `No active plan found for user/organization ${subscriberId}` 
        };
      }

      // Check if plan has expired
      const now = new Date();
      if (userPlan.endDate && userPlan.endDate <= now) {
        this.logger.warn(
          `Plan expired for subscriber ${subscriberId}. End date: ${userPlan.endDate}`
        );
        return { 
          canUse: false, 
          reason: `Subscription plan has expired` 
        };
      }

      const usageRecord = userPlan.usage?.find(
        u => u.planFeatureProperty?.feature?.name === featureName,
      );

      if (!usageRecord) {
        this.logger.debug(
          `Feature ${featureName} not found in plan for subscriber ${subscriberId}`
        );
        return { 
          canUse: false, 
          reason: `Feature ${featureName} not found in plan` 
        };
      }

      // Check if feature is unlimited
      if (usageRecord.planFeatureProperty?.properties?.isUnlimited) {
        return { canUse: true };
      }

      // Check if usage limit reached
      const limit = usageRecord.planFeatureProperty?.properties?.limit;
      const currentUsage = usageRecord.usageCount ?? 0;

      if (limit !== undefined && currentUsage >= limit) {
        this.logger.warn(
          `Usage limit reached for subscriber ${subscriberId}, feature ${featureName}. Limit: ${limit}, Current: ${currentUsage}`
        );
        return { 
          canUse: false, 
          reason: `Usage limit reached for feature ${featureName}. Limit: ${limit}, Current: ${currentUsage}` 
        };
      }

      return { canUse: true };
    } catch (error) {
      this.logger.error(
        `Error checking usage limit for subscriber ${subscriberId}, feature ${featureName}: ${error.message}`
      );
      return { 
        canUse: false, 
        reason: `Failed to check usage limit` 
      };
    }
  }
}
