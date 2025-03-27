import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import moment from 'moment-timezone';
import { UserPlan, UserPlanUsage } from 'src/entity';
import { PlanTypeEnum, SeedPlanNamesEnum } from '@types';

@Injectable()
export class PlanResetJob {
    constructor(
        @InjectRepository(UserPlan)
        private readonly userPlanRepository: Repository<UserPlan>,

        @InjectRepository(UserPlanUsage)
        private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetPlanUsage(): Promise<void> {
        console.log('Starting plan usage reset job...');

        const currentDate = moment().startOf('day').toDate();

        const userPlansToReset = await this.userPlanRepository.find({
            where: { resetDate: currentDate, isSubscriptionActive: true, plan: { name: SeedPlanNamesEnum.BASIC_PLAN } },
            relations: ['plan', 'usage', 'usage.planFeatureProperty'],
        });

        if (userPlansToReset.length === 0) {
            console.log('No user plans to reset today.');
            return;
        }

        for (const userPlan of userPlansToReset) {
            for (const usage of userPlan.usage) {
                if (usage.planFeatureProperty?.properties?.isUnlimited) {
                    usage.usageCount = usage.planFeatureProperty.properties.limit || null;
                }
            }
            await this.userPlanUsageRepository.save(userPlan.usage);
            userPlan.startDate = currentDate;
            userPlan.endDate = userPlan.plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : userPlan.plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
            userPlan.resetDate = userPlan.endDate
            await this.userPlanRepository.save(userPlan);
        }

        console.log(`Plan usage reset completed for ${userPlansToReset.length} users.`);
    }
}
