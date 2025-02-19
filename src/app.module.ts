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
import { ClerkClientProvider } from './common/providers';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from '@guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.development`,
      load: [configuration],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    SessionsModule,
    MacrosModule,
    TemplatesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ClerkClientProvider,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
