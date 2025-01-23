import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { Note, Session, Transcript } from 'src/entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionsModule {}
