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
    TemplatesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
