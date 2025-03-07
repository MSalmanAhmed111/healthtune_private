import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [UserModule, AppointmentModule, SessionsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
