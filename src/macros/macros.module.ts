import { Module } from '@nestjs/common';
import { MacrosService } from './macros.service';
import { MacrosController } from './macros.controller';
import { Macro, User, UserPlanUsage, UserPlan } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Macro, User, UserPlanUsage, UserPlan]), CommonServicesModule],
  controllers: [MacrosController],
  providers: [MacrosService],
})
export class MacrosModule {}
