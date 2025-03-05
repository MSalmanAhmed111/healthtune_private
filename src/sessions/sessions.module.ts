import { Module } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';
import { DiagnosisCodes, DoctorNotes, FileStorage, Note, Session, Transcript } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Note, Transcript, DoctorNotes, DiagnosisCodes, FileStorage]), FileStorageModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionsModule {}
