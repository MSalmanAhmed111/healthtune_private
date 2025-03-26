import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import configuration from '@config/configuration';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/db-config';
import { MacrosModule } from './macros/macros.module';
import { TemplatesModule } from './templates/templates.module';
import { ClerkClientProvider, StripeClientProvider } from './common/providers';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from '@guards/auth.guard';
import { ClerkWebhookModule } from './webhooks/clerk/clerk-webhook.module';
import { UserModule } from './user/user.module';
import { SettingModule } from './setting/setting.module';
import { PatientModule } from './patient/patient.module';
import { AppointmentModule } from './appointment/appointment.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PlanModule } from './plan/plan.module';
import { StripeWebhookModule } from './webhooks/stripe/stripe-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.ENVIRONMENT || 'development'}`,
      load: [configuration],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    SessionsModule,
    MacrosModule,
    TemplatesModule,
    ClerkWebhookModule,
    StripeWebhookModule,
    SettingModule,
    PatientModule,
    AppointmentModule,
    UserModule,
    FileStorageModule,
    AuthModule,
    AdminModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ClerkClientProvider,
    StripeClientProvider,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
