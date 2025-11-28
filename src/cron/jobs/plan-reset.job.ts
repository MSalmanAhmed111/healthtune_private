import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import moment from 'moment-timezone';
import { Plan, UserPlan, UserPlanUsage } from 'src/entity';
import { PlanTypeEnum, SeedPlanNamesEnum } from '@types';
import { PlanErrorMessages } from '@messages';
import { StripeWebhookService } from 'src/webhooks/stripe/stripe-webhook.service';

@Injectable()
export class PlanResetJob {
    constructor(
        @InjectRepository(UserPlan)
        private readonly userPlanRepository: Repository<UserPlan>,

        @InjectRepository(UserPlanUsage)
        private readonly userPlanUsageRepository: Repository<UserPlanUsage>,

        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>,
        private stripeWebhookServie: StripeWebhookService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetFreePlanUsage(): Promise<void> {
        console.log('Starting plan usage reset job...');

        const currentDate = moment().toDate();
        const currentStartDate = moment().startOf('day').toDate();
        const currentEndDate = moment().startOf('day').toDate();

        const userPlansToReset = await this.userPlanRepository.find({
            where: { resetDate: Between(currentStartDate, currentEndDate), isSubscriptionActive: true, plan: { name: SeedPlanNamesEnum.BASIC_PLAN } },
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

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async updatePlan(): Promise<void> {
        console.log('Starting update plan job...');

        const currentStartDate = moment().startOf('day').toDate();
        const currentEndDate = moment().startOf('day').toDate();

        const defaultPlan = await this.planRepository.findOne({
            where: { name: SeedPlanNamesEnum.BASIC_PLAN },
            relations: ['features']
        });
        if (!defaultPlan) throw new NotFoundException(PlanErrorMessages.planNotExists);

        const userPlansToUpdate = await this.userPlanRepository.find({
            where: { 
                resetDate: Between(currentStartDate, currentEndDate), 
                isSubscriptionActive: false, 
                stripeSubscriptionId: null, 
                planId: Not(defaultPlan.id) 
            },
            relations: ['plan', 'usage', 'usage.planFeatureProperty'],
        });

        if (userPlansToUpdate.length === 0) {
            console.log('No user plans to update today.');
            return;
        }

        for (const userPlan of userPlansToUpdate) {
            await this.stripeWebhookServie.createNewUserPlan(userPlan, defaultPlan);

        }

        console.log(`Plan update completed for ${userPlansToUpdate.length} users.`);
    }
}
