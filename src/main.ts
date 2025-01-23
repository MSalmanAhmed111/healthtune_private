import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { createDocument } from '@swagger/swagger';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const appPrefix: string = configService.get<string>('app.prefix');
  const docsPrefix: string = configService.get<string>('app.docsPrefix');
  const swaggerUser: string = configService.get<string>('app.swaggerAuthUser');
  const swaggerPassword: string = configService.get<string>('app.swaggerAuthPassword');
  const storagePath: string = configService.get<string>('storage.path');
  app.setGlobalPrefix(appPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use('/api/media', express.static(storagePath));
  SwaggerModule.setup(docsPrefix, app, createDocument(app, docsPrefix, swaggerUser, swaggerPassword));
  const port: number = configService.get<number>('PORT');
  await app.listen(port);
}
bootstrap();
