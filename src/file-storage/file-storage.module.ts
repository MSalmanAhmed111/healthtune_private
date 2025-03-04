import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileStorageController } from './file-storage.controller';
import { storageProviderFactory } from 'src/common/providers';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorage } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([FileStorage])],
  controllers: [FileStorageController],
  providers: [
    FileStorageService,
    {
      provide: 'StorageProvider',
      useFactory: (configService: ConfigService) => storageProviderFactory(configService.get('storage.provider')),
      inject: [ConfigService],
    },
  ],
  exports: [FileStorageService],
})
export class FileStorageModule {}
