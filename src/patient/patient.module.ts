import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { FileStorage, Patient, Setting, User } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User, FileStorage, Setting]), 
    FileStorageModule,
    CommonServicesModule
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
