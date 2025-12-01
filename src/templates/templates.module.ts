import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template, User, UserPlanUsage } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Template, User, UserPlanUsage])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
