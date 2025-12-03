import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template, User, UserPlanUsage, UserPlan } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Template, User, UserPlanUsage, UserPlan]), CommonServicesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
