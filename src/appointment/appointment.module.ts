import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment, User, Patient } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, User]),
    CommonServicesModule
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
