import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { Note, Session, Transcript, User } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript, User])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionsModule {}
