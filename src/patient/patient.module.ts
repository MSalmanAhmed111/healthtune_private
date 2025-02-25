import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { Patient } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
