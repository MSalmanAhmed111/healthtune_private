import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { FileStorage, Patient, Setting, User, Appointment, UserPlanUsage } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User, FileStorage, Setting, Appointment, UserPlanUsage]), 
    FileStorageModule,
    CommonServicesModule
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
