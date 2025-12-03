import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { Appointment, DiagnosisCodes, DoctorNotes, FileStorage, Note, Organization, Patient, Session, SessionCosting, Setting, Transcript, User, UserPlanUsage, UserPlan } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { ConfigService } from '@nestjs/config';
import { storageProviderFactory } from 'src/common/providers';
import { CommonServicesModule } from 'src/common/services/common-services.module';
import { EncryptionModule } from 'src/common/encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, UserPlanUsage, UserPlan, Appointment, Session, Note, Transcript, DoctorNotes, DiagnosisCodes, Patient, Setting, FileStorage, SessionCosting]), FileStorageModule, EncryptionModule, CommonServicesModule],
  controllers: [SessionController],
  providers: [
    SessionService,
    {
      provide: 'StorageProvider',
      useFactory: (configService: ConfigService) => storageProviderFactory(configService.get('storage.provider')),
      inject: [ConfigService],
    },
  ],
  exports: [SessionService],
})
export class SessionsModule {}
