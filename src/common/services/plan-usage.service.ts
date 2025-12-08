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

  async trackUsage(
    subscriberId: number,
    featureName: PlanFeatureNameEnum,
    amount: number = 1,
  ): Promise<number> {
  
    // Try to find user's plan first (individual subscription)
    let userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: subscriberId,
        isSubscriptionActive: true,
      },
      relations: [
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ],
    });

    // If no user plan, try organization plan
    if (!userPlan) {
      userPlan = await this.userPlanRepository.findOne({
        where: {
          subscriberType: SubscriberType.ORGANIZATION,
          subscriberId: subscriberId,
          isSubscriptionActive: true,
        },
        relations: [
          'usage',
          'usage.planFeatureProperty',
          'usage.planFeatureProperty.feature'
        ],
      });
    }

    if (!userPlan) {
      throw new NotFoundException(`No active plan found for user/organization ${subscriberId}`);
    }

    // Find usage record for this feature
    const usageRecord = userPlan.usage?.find(
      u => u.planFeatureProperty?.feature?.name === featureName,
    );

    if (!usageRecord) {
      throw new NotFoundException(
        `Usage record not found for feature ${featureName} in user/org ${subscriberId}`,
      );
    }

    const currentCount = usageRecord.usageCount ?? 0;
    const newCount = Math.max(0, currentCount + amount); // Prevent negative counts

    try {
      const result = await this.userPlanUsageRepository
        .createQueryBuilder()
        .update(UserPlanUsage)
        .set({ usageCount: newCount })
        .where('id = :id', { id: usageRecord.id })
        .execute();

      if (!result.affected || result.affected === 0) {
        this.logger.error(`Failed to update usage record for org ${orgId}, feature ${featureName}`);
      }
    } catch (dbErr) {
      this.logger.error(`Database update failed: ${dbErr.message}`);
      throw dbErr;
    }

    return newCount;
  }

  async getUsage(subscriberId: number, featureName: PlanFeatureNameEnum): Promise<number | null> {
    // First, check user's plan (individual subscription)
    let userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: subscriberId,
        isSubscriptionActive: true,
      },
      relations: [
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ],
    });

    // If no user plan, check organization's plan
    if (!userPlan) {
      userPlan = await this.userPlanRepository.findOne({
        where: {
          subscriberType: SubscriberType.ORGANIZATION,
          subscriberId: subscriberId,
          isSubscriptionActive: true,
        },
        relations: [
          'usage',
          'usage.planFeatureProperty',
          'usage.planFeatureProperty.feature'
        ],
      });
    }

    if (!userPlan) {
      return null;
    }

    const usageRecord = userPlan.usage?.find(
      u => u.planFeatureProperty?.feature?.name === featureName,
    );

    return usageRecord?.usageCount ?? 0;
  }


  async getAllUsage(subscriberId: number): Promise<
    Array<{
      featureName: string;
      usageCount: number;
      isUnlimited: boolean;
    }>
  > {
    // First, check user's plan (individual subscription)
    let userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: subscriberId,
        isSubscriptionActive: true,
      },
      relations: [
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ],
    });

    // If no user plan, check organization's plan
    if (!userPlan) {
      userPlan = await this.userPlanRepository.findOne({
        where: {
          subscriberType: SubscriberType.ORGANIZATION,
          subscriberId: subscriberId,
          isSubscriptionActive: true,
        },
        relations: [
          'usage',
          'usage.planFeatureProperty',
          'usage.planFeatureProperty.feature'
        ],
      });
    }

    if (!userPlan) {
      return [];
    }

    return userPlan.usage?.map(u => ({
      featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
      usageCount: u.usageCount ?? 0,
      isUnlimited: u.planFeatureProperty?.properties?.isUnlimited ?? false,
    })) || [];
  }

  async checkUsageLimitBeforeIncrement(
    subscriberId: number,
    featureName: PlanFeatureNameEnum,
  ): Promise<{ canUse: boolean; reason?: string }> {
    // First, check user's plan (individual subscription)
    let userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: subscriberId,
        isSubscriptionActive: true,
      },
      relations: [
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ],
    });

    // If no user plan, check organization's plan
    if (!userPlan) {
      userPlan = await this.userPlanRepository.findOne({
        where: {
          subscriberType: SubscriberType.ORGANIZATION,
          subscriberId: subscriberId,
          isSubscriptionActive: true,
        },
        relations: [
          'usage',
          'usage.planFeatureProperty',
          'usage.planFeatureProperty.feature'
        ],
      });
    }

    if (!userPlan) {
      return { canUse: false, reason: `No active plan found for user/organization ${subscriberId}` };
    }

    const usageRecord = userPlan.usage?.find(
      u => u.planFeatureProperty?.feature?.name === featureName,
    );

    if (!usageRecord) {
      return { canUse: false, reason: `Feature ${featureName} not found in plan` };
    }

    // Check if feature is unlimited
    if (usageRecord.planFeatureProperty?.properties?.isUnlimited) {
      return { canUse: true };
    }

    // Check if usage limit reached
    const limit = usageRecord.planFeatureProperty?.properties?.limit;
    const currentUsage = usageRecord.usageCount ?? 0;

    if (limit !== undefined && currentUsage >= limit) {
      return { canUse: false, reason: `Usage limit reached for feature ${featureName}. Limit: ${limit}, Current: ${currentUsage}` };
    }

    return { canUse: true };
  }
}
