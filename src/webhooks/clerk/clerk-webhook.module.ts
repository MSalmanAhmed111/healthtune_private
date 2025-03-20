import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, User, UserPlan, UserPlanUsage } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPlan, Plan, UserPlanUsage])],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ConfigService],
})
export class ClerkWebhookModule {}
