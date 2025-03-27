import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, PlanFeature, User, UserPlan, UserPlanUsage } from '@entities';
import { StripeHelper } from '@helpers/index';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPlan, Plan, UserPlanUsage, PlanFeature])],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService, ConfigService, StripeHelper],
  exports: [StripeWebhookService]
})
export class StripeWebhookModule { }
