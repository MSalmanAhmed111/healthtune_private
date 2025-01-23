import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript } from 'src/entity';
import { Brackets, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SessionStatusEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, PaginationQueryDto } from 'src/dto';
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
  ) {}

  async createSession(reqBody: CreateSessionDto): Promise<ApiMessageData> {
    const { patientName, sex, sessionType, noteFormat, language } = reqBody;

    let session = await this.sessionRepository.findOne({ where: { patientName } });
    if (session) throw new BadRequestException(SessionErrorMessages.sessionAlreadyExists);

    session = this.sessionRepository.create({ patientName, sex, sessionType, noteFormat, language });
    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async addNoteToSession(sessionId: number, createNoteBody: AddNoteDto): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let note = this.noteRepository.create({ sessionId, content: createNoteBody.content });
    note = await this.noteRepository.save(note);
    await this.sessionRepository.update({ id: sessionId }, { note });

    return { message: SuccessResponseMessages.successGeneral, data: note };
  }

  async addTranscriptToSession(sessionId: number, reqBody: AddTranscriptDto): Promise<ApiMessageData> {
    const { assemblyId, content } = reqBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let transcript = this.transcriptRepository.create({ sessionId, assemblyId: assemblyId, content: content });
    transcript = await this.transcriptRepository.save(transcript);
    await this.sessionRepository.update({ id: sessionId }, { transcript, status: SessionStatusEnum.COMPLETED });

    return { message: SuccessResponseMessages.successGeneral, data: transcript };
  }

  async getSessions(getSessionsDto: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    const { query, page, limit, sort = 'DESC' } = getSessionsDto;
    const qb = this.sessionRepository.createQueryBuilder('session').select(['session']).orderBy('session.createdAt', sort);

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(session.patientName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.sessionType) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.language) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }

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
