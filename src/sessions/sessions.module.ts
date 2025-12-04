import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { Appointment, DiagnosisCodes, DoctorNotes, FileStorage, Note, Organization, Patient, Session, SessionCosting, Setting, Transcript, User, UserPlanUsage } from '@entities';
import { SessionFeedback } from './entity/session-feedback.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { ConfigService } from '@nestjs/config';
import { storageProviderFactory } from 'src/common/providers';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';
import { DataAccessService } from 'src/common/services/data-access.service';
import { EncryptionModule } from 'src/common/encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, UserPlanUsage, Appointment, Session, Note, Transcript, DoctorNotes, DiagnosisCodes, Patient, Setting, FileStorage, SessionCosting, SessionFeedback]), FileStorageModule, EncryptionModule],
  controllers: [SessionController],
  providers: [
    RoleBasedAccessService,
    DataAccessService,
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
