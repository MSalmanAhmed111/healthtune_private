import { Module } from '@nestjs/common';
import { MacrosService } from './macros.service';
import { MacrosController } from './macros.controller';
import { Macro } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Macro])],
  controllers: [MacrosController],
  providers: [MacrosService],
})
export class MacrosModule {}
