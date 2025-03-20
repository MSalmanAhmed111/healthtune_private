import { User, UserPlanUsage, UserPlan, Plan } from "@entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([User, UserPlanUsage, UserPlan, Plan])],
  providers: [],
  exports: [],
})
export class CronJobModule {}
