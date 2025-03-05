import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClerkClientProvider } from 'src/common/providers';
import { FileStorage, User } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, FileStorage]), FileStorageModule],
  controllers: [UserController],
  providers: [UserService, ClerkClientProvider],
  exports: [UserService],
})
export class UserModule {}
