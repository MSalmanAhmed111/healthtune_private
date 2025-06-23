import { Module } from '@nestjs/common';
import { QuickNotessService } from './quick-notes.service';
import { QuickNotessController } from './quick-notes.controller';
import { QuickNotes } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { storageProviderFactory } from 'src/common/providers';

@Module({
  imports: [TypeOrmModule.forFeature([QuickNotes])],
  controllers: [QuickNotessController],
  providers: [
    QuickNotessService,
    {
      provide: 'StorageProvider',
      useFactory: (configService: ConfigService) => storageProviderFactory(configService.get('storage.provider')),
      inject: [ConfigService],
    },
  ],
})
export class QuickNotessModule {}
