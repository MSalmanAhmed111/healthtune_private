import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ClerkClientProvider } from 'src/common/providers';
import { ClerkStrategy } from '@strategies/clert-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { User } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule, ConfigModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, ClerkStrategy, ClerkClientProvider],
  exports: [PassportModule],
})
export class AuthModule {}
