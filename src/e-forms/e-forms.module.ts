import { Module } from '@nestjs/common';
import { EDocumentService } from './e-forms.service';
import { EDocumentController } from './e-forms.controller';
import { EDocument, User, EDocumentIssuance, Patient, UserPlanUsage, UserPlan } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { ConfigService } from '@nestjs/config';
import { storageProviderFactory } from 'src/common/providers';
import { CommonServicesModule } from 'src/common/services/common-services.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, EDocument, EDocumentIssuance, Patient, UserPlanUsage, UserPlan]), FileStorageModule, CommonServicesModule],
  controllers: [EDocumentController],
  providers: [
    EDocumentService,
    {
      provide: 'StorageProvider',
      useFactory: (configService: ConfigService) => storageProviderFactory(configService.get('storage.provider')),
      inject: [ConfigService],
    },
  ],
  exports: [EDocumentService],
})
export class EDocumentsModule { }
