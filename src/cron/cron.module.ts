import { User, UserPlanUsage, UserPlan, Plan } from "@entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { StripeWebhookModule } from "src/webhooks/stripe/stripe-webhook.module";

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([User, UserPlanUsage, UserPlan, Plan]), StripeWebhookModule],
  providers: [],
  exports: [],
})
export class CronJobModule {}
