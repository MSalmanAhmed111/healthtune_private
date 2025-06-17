import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { User, Appointment, Session } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'typeorm';

@Module({
  imports: [UserModule, AppointmentModule, SessionsModule, TypeOrmModule.forFeature([User, Session, Admin, Appointment])], 
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
