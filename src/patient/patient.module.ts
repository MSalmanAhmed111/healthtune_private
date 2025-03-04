import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { FileStorage, Patient } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, FileStorage]), FileStorageModule],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
