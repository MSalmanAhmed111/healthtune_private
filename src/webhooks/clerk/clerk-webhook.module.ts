import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, Setting, User, UserPlan, UserPlanUsage, Organization, Role, Permission } from '@entities';
import { StripeHelper } from '@helpers/index';
import { DataAccessService } from 'src/common/services/data-access.service';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, UserPlan, Plan, UserPlanUsage, Setting, Role, Permission])],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ConfigService, StripeHelper, RoleBasedAccessService, DataAccessService],
})
export class ClerkWebhookModule {}
