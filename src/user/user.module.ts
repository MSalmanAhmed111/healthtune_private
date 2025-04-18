import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClerkClientProvider } from 'src/common/providers';
import { FileStorage, Plan, PlanFeature, PlanFeatureProperty, User, UserPlan, UserPlanUsage, SubscriptionHistory, Appointment, Session } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { StripeHelper } from '@helpers/stripe.helper';
import { StripeWebhookModule } from 'src/webhooks/stripe/stripe-webhook.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, FileStorage, Plan, PlanFeature, PlanFeatureProperty, UserPlan, UserPlanUsage, SubscriptionHistory, Appointment, Session]), FileStorageModule, StripeWebhookModule],
  controllers: [UserController],
  providers: [UserService, ClerkClientProvider, StripeHelper],
  exports: [UserService],
})
export class UserModule {}
