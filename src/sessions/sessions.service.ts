import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript, DoctorNotes, DiagnosisCodes, FileStorage, Patient, Setting } from '@entities';
import { Between, Brackets, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SessionStatusEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, PaginationUserQueryDto, GetSessionStatsDto, GetSessionsDto } from 'src/dto';
import { ErrorResponseMessages, PatientErrorMessages, SessionErrorMessages, SuccessResponseMessages } from '@messages';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(DoctorNotes)
    private readonly doctorNoteRepository: Repository<DoctorNotes>,
    @InjectRepository(Transcript)
    private readonly transcriptRepository: Repository<Transcript>,
    @InjectRepository(DiagnosisCodes)
    private readonly diagnosisCodestRepository: Repository<DiagnosisCodes>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async createSession(reqBody: CreateSessionDto, userId: number): Promise<ApiMessageData> {
    const { patientFirstName, patientLastName, sessionType, noteFormat, language } = reqBody;
    let { patientId, sex } = reqBody;
    let patientName = null;

    const patientRecordSettings = await this.settingRepository.findOne({ where: { name: 'Enable patient records' } });
    if (!patientRecordSettings || patientRecordSettings.value == undefined) throw new NotFoundException(SessionErrorMessages.patientRecordSettingError);

    if (patientId) {
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
      patientName = patient.firstName + '' + patient.lastName;
      sex = patient.gender;
    } else if (patientFirstName && patientLastName) {
      if (patientRecordSettings.value) {
        let mreCount = '0';
        let patient = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
        if (patient) mreCount = patient.id.toString();
        const mreNumber = `MRE-${(mreCount + 1).padStart(7, '0')}`;
        let createdPatient = this.patientRepository.create({ firstName: patientFirstName, lastName: patientLastName, mreNumber, gender: sex });
        createdPatient = await this.patientRepository.save(createdPatient);
        patientId = createdPatient.id;
        patientName = createdPatient.firstName + ' ' + createdPatient.lastName;
      } else patientName = patientFirstName + ' ' + patientLastName;
    } else {
      throw new NotFoundException(SessionErrorMessages.patientIdOrNameRequired);
    }
    const session = this.sessionRepository.create({ patientId, patientName, sex, sessionType, noteFormat, language, userId });
    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async addNoteToSession(sessionId: number, createNoteBody: AddNoteDto): Promise<ApiMessageData> {
    const { content } = createNoteBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let note = await this.noteRepository.findOne({ where: { sessionId } });
    if (note) note.content = content || note.content;
    else note = this.noteRepository.create({ sessionId, content });

    note = await this.noteRepository.save(note);
    session.note = note;

    await this.sessionRepository.save(session);
    return { message: SuccessResponseMessages.successGeneral, data: note };
  }

  async addDoctorNotesToSession(sessionId: number, createNoteBody: AddNoteDto): Promise<ApiMessageData> {
    const { content } = createNoteBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let doctorNote = await this.doctorNoteRepository.findOne({ where: { sessionId } });
    if (doctorNote) doctorNote.content = content || doctorNote.content;
    else doctorNote = this.doctorNoteRepository.create({ sessionId, content });

    doctorNote = await this.doctorNoteRepository.save(doctorNote);
    session.doctorNotes = doctorNote;

    await this.sessionRepository.save(session);
    return { message: SuccessResponseMessages.successGeneral, data: doctorNote };
  }

  async addDiagnosisCodes(sessionId: number, createNoteBody: AddNoteDto): Promise<ApiMessageData> {
    const { content } = createNoteBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let diagnosisCodes = await this.diagnosisCodestRepository.findOne({ where: { sessionId } });
    if (diagnosisCodes) diagnosisCodes.content = content || diagnosisCodes.content;
    else diagnosisCodes = this.diagnosisCodestRepository.create({ sessionId, content });

    diagnosisCodes = await this.diagnosisCodestRepository.save(diagnosisCodes);
    session.diagnosisCodes = diagnosisCodes;

    await this.sessionRepository.save(session);
    return { message: SuccessResponseMessages.successGeneral, data: diagnosisCodes };
  }

  async addTranscriptToSession(sessionId: number, reqBody: AddTranscriptDto): Promise<ApiMessageData> {
    const { assemblyId, content, duration, audioFile } = reqBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    let transcript = await this.transcriptRepository.findOne({ where: { sessionId } });
    if (transcript) {
      transcript.assemblyId = assemblyId || transcript.assemblyId;
      transcript.content = content || transcript.content;
    } else {
      if (!sessionId || !assemblyId || !content) throw new NotFoundException(SessionErrorMessages.missingTrancriptFields);
      transcript = this.transcriptRepository.create({ sessionId, assemblyId, content });
    }
    transcript = await this.transcriptRepository.save(transcript);
    session.status = SessionStatusEnum.COMPLETED;
    session.duration = duration || session.duration;
    session.transcript = transcript;

    if (audioFile && audioFile !== session.audioFile) {
      const audioExists = this.fileStorageRepository.findOne({ where: { id: audioFile as number } });
      if (!audioExists) throw new NotFoundException(ErrorResponseMessages.fileNotExists);
      if (session.audioFile) {
        const previousAudioFileExists = this.fileStorageRepository.findOne({ where: { id: session.audioFile as number } });
        if (previousAudioFileExists) await this.fileStorageService.deleteFileStorage(session.audioFile as number);
      }
      session.audioFile = audioFile;
    }

    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: transcript };
  }

  async getSessions(getSessionsDto: GetSessionsDto, userId: number = undefined): Promise<ApiMessageDataPagination> {
    const { query, page, limit, sort = 'DESC', patientId } = getSessionsDto;
    const qb = this.sessionRepository.createQueryBuilder('session').leftJoinAndSelect('session.note', 'note').leftJoinAndSelect('session.patient', 'patient').orderBy('session.createdAt', sort);

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(session.patientName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.sessionType) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.language) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.mreNumber, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.firstName, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.lastName, '')) LIKE LOWER(:query)`, { query: `%${query}%` });
        }),
      );
    }
    if (userId) qb.andWhere('session.userId = :userId', { userId });
    if (patientId) qb.andWhere('session.patientId = :patientId', { patientId });

    qb.skip((page - 1) * limit).take(limit);

    const [sessions, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    for (const session of sessions) {
      session.patient = undefined;
      if (session.audioFile) {
        const audioFile = await this.fileStorageRepository.findOne({ where: { id: session.audioFile as number } });
        if (audioFile) session.audioFile = { id: audioFile.id, fileName: audioFile.name };
      }
    }
    return { message: SuccessResponseMessages.successGeneral, data: sessions, page: page, total: total, lastPage: lastPage };
  }

  async getSession(sessionId: number, userId: number = undefined): Promise<ApiMessageData> {
    const where = userId !== undefined ? { id: sessionId, userId } : { id: sessionId };
    const session = await this.sessionRepository.findOne({ where, relations: ['note', 'transcript', 'doctorNotes', 'diagnosisCodes', 'patient'] });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    if (session.audioFile) {
      const audioFile = await this.fileStorageRepository.findOne({ where: { id: session.audioFile as number } });
      if (audioFile) session.audioFile = { id: audioFile.id, fileName: audioFile.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async getSessionStats(reqQueryParams: GetSessionStatsDto, userId: number = undefined): Promise<ApiMessageData> {
    let { startDate, endDate } = reqQueryParams;
    startDate = startDate ? new Date(startDate) : new Date('2020-01-01T00:00:00.000Z');
    endDate = endDate ? new Date(endDate) : new Date();

    let where: any = userId ? { userId, createdAt: Between(startDate, endDate) } : { createdAt: Between(startDate, endDate) };
    const sessionCount = await this.sessionRepository.count({ where });

    where = userId ? { userId, updatedAt: Between(startDate, endDate), status: SessionStatusEnum.COMPLETED } : { updatedAt: Between(startDate, endDate), status: SessionStatusEnum.COMPLETED };
    const sessionCompletedCount = await this.sessionRepository.count({
      where: { userId, updatedAt: Between(startDate, endDate), status: SessionStatusEnum.COMPLETED },
    });

    where = userId ? { userId, createdAt: Between(startDate, endDate) } : { createdAt: Between(startDate, endDate) };
    const sessionDurationAvg = await this.sessionRepository.average('duration', { userId, createdAt: Between(startDate, endDate) });
    return {
      message: SuccessResponseMessages.successGeneral,
      data: { sessionCount, sessionCompletedCount, sessionDurationAvg },
    };
  }
}
