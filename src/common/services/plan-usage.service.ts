import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlan, UserPlanUsage } from '@entities';
import { PlanFeatureNameEnum } from '@types';
import { SubscriberType } from 'src/user/entity/user-plan.entity';

/**
 * PlanUsageService
 * 
 * Centralized service for tracking plan feature usage.
 * 
 * Strategy: Always INCREMENT usage count when features are consumed.
 * This provides reliable tracking for all plan types (limited or unlimited).
 * Back-office manually calculates billing based on usage reports.
 * 
 * Usage flow:
 * - Create session/template/macro/form -> trackUsage(+1)
 * - Delete session/template/macro/form -> trackUsage(-1) [restores usage]
 * 
 * All organizations (limited or unlimited plans) are tracked uniformly.
 */
@Injectable()
export class PlanUsageService {
  constructor(
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
  ) {}

  async trackUsage(
    orgId: number,
    featureName: PlanFeatureNameEnum,
    amount: number = 1,
  ): Promise<number> {
    // Get org's active plan
    const userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: orgId,
        isSubscriptionActive: true,
      },
      relations: ['usage', 'usage.planFeatureProperty', 'usage.planFeatureProperty.feature'],
    });

    if (!userPlan) {
      throw new NotFoundException(`No active plan found for organization ${orgId}`);
    }

    // Find usage record for this feature
    const usageRecord = userPlan.usage?.find(
      u => u.planFeatureProperty?.feature?.name === featureName,
    );

    if (!usageRecord) {
      throw new NotFoundException(
        `Usage record not found for feature ${featureName} in org ${orgId}`,
      );
    }

    // Update usage count (increment or decrement)
    // Initialize to 0 if null (handles edge cases)
    const currentCount = usageRecord.usageCount ?? 0;
    usageRecord.usageCount = Math.max(0, currentCount + amount); // Prevent negative counts

    // Save updated usage
    await this.userPlanUsageRepository.save(usageRecord);

    return usageRecord.usageCount;
  }

  async getUsage(orgId: number, featureName: PlanFeatureNameEnum): Promise<number | null> {
    const userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: orgId,
        isSubscriptionActive: true,
      },
      relations: ['usage', 'usage.planFeatureProperty', 'usage.planFeatureProperty.feature'],
    });

    if (!userPlan) {
      return null;
    }

    const usageRecord = userPlan.usage?.find(
      u => u.planFeatureProperty?.feature?.name === featureName,
    );

    return usageRecord?.usageCount ?? 0;
  }


  async getAllUsage(orgId: number): Promise<
    Array<{
      featureName: string;
      usageCount: number;
      isUnlimited: boolean;
    }>
  > {
    const userPlan = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: orgId,
        isSubscriptionActive: true,
      },
      relations: ['usage', 'usage.planFeatureProperty', 'usage.planFeatureProperty.feature'],
    });

    if (!userPlan) {
      return [];
    }

    return userPlan.usage?.map(u => ({
      featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
      usageCount: u.usageCount ?? 0,
      isUnlimited: u.planFeatureProperty?.properties?.isUnlimited ?? false,
    })) || [];
  }
}
