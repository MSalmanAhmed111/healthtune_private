import { Module } from '@nestjs/common';
import { RoleBasedAccessService } from './role-based-access.service';
import { DataAccessService } from './data-access.service';
import { Patient, User, Appointment, Session, Organization } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, Appointment, Session, Organization])],
  providers: [RoleBasedAccessService, DataAccessService],
  exports: [RoleBasedAccessService, DataAccessService],
})
export class CommonServicesModule {}
