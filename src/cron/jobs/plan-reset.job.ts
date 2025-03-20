import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import moment from 'moment-timezone';
import { UserPlan, UserPlanUsage } from 'src/entity';

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
            where: { resetDate: currentDate, isSubscriptionActive: true },
            relations: ['usage', 'usage.planFeatureProperty'],
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
        }

        console.log(`Plan usage reset completed for ${userPlansToReset.length} users.`);
    }
}
