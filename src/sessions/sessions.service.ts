import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript, DoctorNotes, DiagnosisCodes } from '@entities';
import { Between, Brackets, MoreThanOrEqual, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SessionStatusEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, PaginationUserQueryDto, GetSessionStatsDto } from 'src/dto';
import { SessionErrorMessages, SuccessResponseMessages } from '@messages';

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
  ) {}

  async createSession(reqBody: CreateSessionDto, userId: number): Promise<ApiMessageData> {
    const { patientName, sex, sessionType, noteFormat, language } = reqBody;
    const session = this.sessionRepository.create({ patientName, sex, sessionType, noteFormat, language, userId });
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
    const { assemblyId, content, duration } = reqBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    let transcript = await this.transcriptRepository.findOne({ where: { sessionId } });
    if (transcript) {
      transcript.assemblyId = assemblyId || transcript.assemblyId;
      transcript.content = content || transcript.content;
    } else transcript = this.transcriptRepository.create({ sessionId, assemblyId, content });

    transcript = await this.transcriptRepository.save(transcript);
    session.status = SessionStatusEnum.COMPLETED;
    session.duration = duration || session.duration;
    session.transcript = transcript;
    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: transcript };
  }

  async getUserSessions(getSessionsDto: PaginationUserQueryDto, userId: number): Promise<ApiMessageDataPagination> {
    const { query, page, limit, sort = 'DESC' } = getSessionsDto;
    const qb = this.sessionRepository.createQueryBuilder('session').leftJoinAndSelect('session.note', 'note').orderBy('session.createdAt', sort);

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(session.patientName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.sessionType) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.language) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }
    qb.andWhere('session.userId = :userId', { userId });
    qb.skip((page - 1) * limit).take(limit);

    const [sessions, total] = await qb.getManyAndCount();

    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: sessions, page: page, total: total, lastPage: lastPage };
  }

  async getUserSession(sessionId: number, userId: number): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, userId }, relations: ['note', 'transcript', 'doctorNotes', 'diagnosisCodes'] });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async getSessionStats(reqQueryParams: GetSessionStatsDto): Promise<ApiMessageData> {
    let { startDate, endDate, userId } = reqQueryParams;
    startDate = startDate ? new Date(startDate) : new Date('2020-01-01T00:00:00.000Z');
    endDate = endDate ? new Date(endDate) : new Date();
    const sessionCount = await this.sessionRepository.count({ where: { userId, createdAt: Between(startDate, endDate) } });
    const sessionCompletedCount = await this.sessionRepository.count({
      where: { userId, updatedAt: Between(startDate, endDate), status: SessionStatusEnum.COMPLETED },
    });
    const sessionDurationAvg = await this.sessionRepository.average('duration', { userId, createdAt: Between(startDate, endDate) });
    return {
      message: SuccessResponseMessages.successGeneral,
      data: { sessionCount, sessionCompletedCount, sessionDurationAvg },
    };
  }

  // ADMIN APIS

  // async getSessions(getSessionsDto: PaginationUserQueryDto): Promise<ApiMessageDataPagination> {
  //   const { query, userId, page, limit, sort = 'DESC' } = getSessionsDto;
  //   const qb = this.sessionRepository.createQueryBuilder('session').leftJoinAndSelect('session.note', 'note').orderBy('session.createdAt', sort);

  //   if (query) {
  //     qb.andWhere(
  //       new Brackets((qb) => {
  //         qb.where('LOWER(session.patientName) LIKE LOWER(:query)', { query: `%${query}%` })
  //           .orWhere('LOWER(session.sessionType) LIKE LOWER(:query)', { query: `%${query}%` })
  //           .orWhere('LOWER(session.language) LIKE LOWER(:query)', { query: `%${query}%` });
  //       }),
  //     );
  //   }
  //   if (userId) qb.andWhere('session.userId = :userId', { userId: userId });
  //   qb.skip((page - 1) * limit).take(limit);

  //   const [sessions, total] = await qb.getManyAndCount();

  //   const lastPage = Math.ceil(total / limit);
  //   return { message: SuccessResponseMessages.successGeneral, data: sessions, page: page, total: total, lastPage: lastPage };
  // }

  // async getSession(sessionId: number): Promise<ApiMessageData> {
  //   const session = await this.sessionRepository.findOne({ where: { id: sessionId }, relations: ['note', 'transcript', 'doctorNotes'] });
  //   if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
  //   return { message: SuccessResponseMessages.successGeneral, data: session };
  // }
}
