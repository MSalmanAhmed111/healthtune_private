import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { DiagnosisCodes, DoctorNotes, FileStorage, Note, Patient, Session, Setting, Transcript } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript, DoctorNotes, DiagnosisCodes, Patient, Setting, FileStorage]), FileStorageModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionsModule {}
