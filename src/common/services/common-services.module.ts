import { Module } from '@nestjs/common';
import { RoleBasedAccessService } from './role-based-access.service';
import { DataAccessService } from './data-access.service';
import { Patient, User, Appointment, Session, Organization } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, Appointment, Session, Organization]), EncryptionModule],
  providers: [RoleBasedAccessService, DataAccessService],
  exports: [RoleBasedAccessService, DataAccessService, EncryptionModule],
})
export class CommonServicesModule {}
