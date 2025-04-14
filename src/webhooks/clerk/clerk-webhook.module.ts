import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, Setting, User, UserPlan, UserPlanUsage } from '@entities';
import { StripeHelper } from '@helpers/index';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPlan, Plan, UserPlanUsage, Setting])],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ConfigService, StripeHelper],
})
export class ClerkWebhookModule {}
