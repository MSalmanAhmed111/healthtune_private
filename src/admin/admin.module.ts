import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { PlanModule } from 'src/plan/plan.module';
import { User, Appointment, Session, Admin, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory, PlanFeature, PlanFeatureProperty, SessionFeedback } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenStrategy } from '@strategies/access-token.strategy';
import { EncryptionModule } from 'src/common/encryption/encryption.module';

@Module({
  imports: [
    UserModule, 
    AppointmentModule, 
    SessionsModule,
    PlanModule,
    EncryptionModule,
    TypeOrmModule.forFeature([User, Session, Admin, Appointment, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory, PlanFeature, PlanFeatureProperty, SessionFeedback])
  ], 
  controllers: [AdminController],
  providers: [AdminService, JwtService, AccessTokenStrategy],
})
export class AdminModule {}
