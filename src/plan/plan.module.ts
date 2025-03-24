import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { Plan, PlanFeature, PlanFeatureProperty } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeHelper } from '@helpers/stripe.helper';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanFeature, PlanFeatureProperty])],
  controllers: [PlanController],
  providers: [PlanService, StripeHelper],
})
export class PlanModule {}
