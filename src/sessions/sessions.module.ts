import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { DiagnosisCodes, DoctorNotes, Note, Session, Transcript } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript, DoctorNotes, DiagnosisCodes])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionsModule {}
