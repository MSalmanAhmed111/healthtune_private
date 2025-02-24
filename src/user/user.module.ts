import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClerkClientProvider } from 'src/common/providers';

@Module({
  controllers: [UserController],
  providers: [UserService, ClerkClientProvider],
})
export class UserModule {}
