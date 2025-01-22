
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configDotenv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

const configService = new ConfigService();
configDotenv({ path: `.env.${configService.get<string>('ENVIRONMENT') || 'development'}` });

export const dataSourceOptions: TypeOrmModuleOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../entity/*.entity.{ts,js}', __dirname + '/../**/entity/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'migrations',
  seeds: ['src/db/seeds/**/*.{ts,js}'],
  extra: {
    options: `-c timezone=Asia/Karachi`,
  },
};

export default new DataSource(dataSourceOptions as DataSourceOptions);
