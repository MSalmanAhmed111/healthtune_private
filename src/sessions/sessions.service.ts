import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript, User } from 'src/entity';
import { Brackets, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SessionStatusEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, PaginationUserQueryDto } from 'src/dto';
import { SessionErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Transcript)
    private readonly transcriptRepository: Repository<Transcript>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSession(reqBody: CreateSessionDto, userId: number): Promise<ApiMessageData> {
    const { patientName, sex, sessionType, noteFormat, language } = reqBody;

    const user = await this.userRepository.findOne({ where: [{ id: userId }] });

    const session = this.sessionRepository.create({ patientName, sex, sessionType, noteFormat, language, userId: user.id });
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

  async addTranscriptToSession(sessionId: number, reqBody: AddTranscriptDto): Promise<ApiMessageData> {
    const { assemblyId, content } = reqBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    let transcript = await this.transcriptRepository.findOne({ where: { sessionId } });
    if (transcript) {
      transcript.assemblyId = assemblyId || transcript.assemblyId;
      transcript.content = content || transcript.content;
    } else transcript = this.transcriptRepository.create({ sessionId, assemblyId, content });

    transcript = await this.transcriptRepository.save(transcript);
    session.status = SessionStatusEnum.COMPLETED;
    session.transcript = transcript;
    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: transcript };
  }

  async getSessions(getSessionsDto: PaginationUserQueryDto): Promise<ApiMessageDataPagination> {
    const { query, userId, page, limit, sort = 'DESC' } = getSessionsDto;
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
    if (userId) qb.andWhere('session.userId = :userId', { userId: userId });
    qb.skip((page - 1) * limit).take(limit);

    const [sessions, total] = await qb.getManyAndCount();

    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: sessions, page: page, total: total, lastPage: lastPage };
  }

  async getSession(sessionId: number): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId }, relations: ['note', 'transcript'] });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }
}
