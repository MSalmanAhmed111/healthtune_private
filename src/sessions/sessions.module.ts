import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { DoctorNotes, Note, Session, Transcript, User } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript, DoctorNotes])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionsModule {}
