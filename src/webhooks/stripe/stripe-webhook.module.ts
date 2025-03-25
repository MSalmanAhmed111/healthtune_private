import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, User, UserPlan, UserPlanUsage } from '@entities';
import { StripeHelper } from '@helpers/index';
import { StripeClientProvider } from 'src/common/providers';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPlan, Plan, UserPlanUsage])],
  controllers: [StripeWebhookController],
  providers: [StripeClientProvider, ConfigService, StripeHelper],
})
export class StripeWebhookModule {}
