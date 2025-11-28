import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { User, Appointment, Session, Admin, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenStrategy } from '@strategies/access-token.strategy';

@Module({
  imports: [
    UserModule, 
    AppointmentModule, 
    SessionsModule, 
    TypeOrmModule.forFeature([User, Session, Admin, Appointment, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory])
  ], 
  controllers: [AdminController],
  providers: [AdminService, JwtService, AccessTokenStrategy],
})
export class AdminModule {}
