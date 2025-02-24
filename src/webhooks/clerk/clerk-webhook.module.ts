import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ConfigService],
})
export class ClerkWebhookModule {}
