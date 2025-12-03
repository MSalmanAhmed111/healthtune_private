import { Module } from '@nestjs/common';
import { RoleBasedAccessService } from './role-based-access.service';
import { DataAccessService } from './data-access.service';
import { PlanUsageService } from './plan-usage.service';
import { Patient, User, Appointment, Session, Organization, UserPlan, UserPlanUsage } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, Appointment, Session, Organization, UserPlan, UserPlanUsage]), EncryptionModule],
  providers: [RoleBasedAccessService, DataAccessService, PlanUsageService],
  exports: [RoleBasedAccessService, DataAccessService, PlanUsageService, EncryptionModule],
})
export class CommonServicesModule {}
