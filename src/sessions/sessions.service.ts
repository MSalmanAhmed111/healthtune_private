import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript, DoctorNotes, DiagnosisCodes, FileStorage, Patient, Setting, User, UserPlanUsage, SessionCosting } from '@entities';
import { Between, Brackets, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, PlanFeatureNameEnum, SessionStatusEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, GetSessionStatsDto, GetSessionsDto, UpdateSessionDto, AddSessionDetailsDto } from 'src/dto';
import { PatientErrorMessages, SessionErrorMessages, SuccessResponseMessages } from '@messages';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { StorageProviderInterface } from 'src/common/providers';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';
import { DataAccessService } from 'src/common/services/data-access.service';
import moment from 'moment';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(DoctorNotes)
    private readonly doctorNoteRepository: Repository<DoctorNotes>,
    @InjectRepository(Transcript)
    private readonly transcriptRepository: Repository<Transcript>,
    @InjectRepository(DiagnosisCodes)
    private readonly diagnosisCodesRepository: Repository<DiagnosisCodes>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(SessionCosting)
    private readonly sessionCostRepository: Repository<SessionCosting>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    private readonly fileStorageService: FileStorageService,
    private readonly roleBasedAccessService: RoleBasedAccessService,
    private readonly dataAccessService: DataAccessService,
    @Inject('StorageProvider')
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  async createSession(reqBody: CreateSessionDto, userId: number): Promise<ApiMessageData> {
    const { patientFirstName, patientLastName, sessionType, noteFormat, language } = reqBody;
    let { patientId, sex } = reqBody;
    let patientName = null;

    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['userPlan', 'userPlan.usage', 'userPlan.usage.planFeatureProperty', 'userPlan.usage.planFeatureProperty.feature'] });

    if (user.userPlan && user.userPlan.usage.length > 0) {
      const usage = user.userPlan.usage.find((u) => u.planFeatureProperty.feature.name == PlanFeatureNameEnum.SESSION_CREATION);
      if (usage) {
        if (usage.usageCount <= 0) throw new BadRequestException(SessionErrorMessages.noSessionCreationLeft);
        usage.usageCount = usage.usageCount - 1;
        await this.userPlanUsageRepository.save(usage);
      }
    }

    const patientRecordSettings = await this.settingRepository.findOne({ where: { name: 'Enable patient records', userId } });
    if (!patientRecordSettings || patientRecordSettings.value == undefined) throw new NotFoundException(SessionErrorMessages.patientRecordSettingError);

    if (patientId) {
      let whereCondition = { id: patientId };
      let patient = null;
      if (user.clerkOrganizationId !== null) {
        patient = await this.patientRepository.findOne({ where: whereCondition });
      } else {
        patient = await this.patientRepository.findOne({ where: { ...whereCondition, doctorId: userId } });
      }
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
      patientName = patient.firstName + '' + patient.lastName;
      sex = patient.gender;
    } else if (patientFirstName && patientLastName) {
      if (patientRecordSettings.value) {
        //let mreCount = '0';
        let fetchedItem = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
        let mreCount = fetchedItem.id;
        //if (patient) mreCount = patient.id.toString();
        const mreNumber = `MRE-${(mreCount + 1).toString().padStart(7, '0')}`;
        let createdPatient = this.patientRepository.create({ firstName: patientFirstName, lastName: patientLastName, mreNumber, gender: sex, doctorId: userId });
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

  async updateSessionDetails(sessionId: number, dto: AddSessionDetailsDto, audioFile?: Express.Multer.File): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    // Update Note
    if (dto.summary) {
      let note: any = await this.noteRepository.findOne({ where: { sessionId } });
      if (dto.summary && dto.summary.content && typeof dto.summary.content === 'string') dto.summary.content = { note: dto.summary.content };
      if (note) note.content = (dto.summary.content as Record<string, string>) || note.content;
      else note = this.noteRepository.create({ sessionId, content: dto.summary.content as Record<string, string> });
      await this.noteRepository.save(note);
      session.note = note;
    }

    // Update Doctor Notes
    if (dto.doctorNotes) {
      let doctorNote = await this.doctorNoteRepository.findOne({ where: { sessionId } });
      if (dto.doctorNotes && dto.doctorNotes.content && typeof dto.doctorNotes.content === 'string') dto.doctorNotes.content = { note: dto.doctorNotes.content };
      if (doctorNote) doctorNote.content = (dto.doctorNotes.content as Record<string, string>) || doctorNote.content;
      else doctorNote = this.doctorNoteRepository.create({ sessionId, content: dto.doctorNotes.content as Record<string, string> });
      await this.doctorNoteRepository.save(doctorNote);
      session.doctorNotes = doctorNote;
    }

    // Update Diagnosis Codes
    if (dto.diagnosisCodes) {
      let diagnosis = await this.diagnosisCodesRepository.findOne({ where: { sessionId } });
      if (dto.diagnosisCodes && dto.diagnosisCodes.content && typeof dto.diagnosisCodes.content === 'string') dto.diagnosisCodes.content = { note: dto.diagnosisCodes.content };
      if (diagnosis) diagnosis.content = (dto.diagnosisCodes.content as Record<string, string>) || diagnosis.content;
      else diagnosis = this.diagnosisCodesRepository.create({ sessionId, content: dto.diagnosisCodes.content as Record<string, string> });
      await this.diagnosisCodesRepository.save(diagnosis);
      session.diagnosisCodes = diagnosis;
    }

    // Update Transcript
    if (dto.transcript) {
      if (dto.transcript.content && typeof dto.transcript.content === 'string') dto.transcript.content = { transcript: dto.transcript.content };
      const { assemblyId, content, duration } = dto.transcript;
      let transcript: any = await this.transcriptRepository.findOne({ where: { sessionId } });
      if (transcript) {
        transcript.assemblyId = assemblyId || transcript.assemblyId;
        transcript.content = dto.transcript?.content || transcript.content;
      } else {
        if (!assemblyId || !content) {
          throw new BadRequestException(SessionErrorMessages.missingTrancriptFields);
        }
        transcript = this.transcriptRepository.create({ sessionId, assemblyId, content: content as Record<string, string> });
      }
      await this.transcriptRepository.save(transcript);
      session.transcript = transcript;
      session.status = SessionStatusEnum.COMPLETED;
      session.duration = duration ?? session.duration;
    }

    // Upload Audio File
    if (audioFile) {
      if (session.audioFile) await this.storageProvider.deleteFile(session.audioFile);
      const uploadedAudio = await this.storageProvider.uploadFile(audioFile);
      session.audioFile = uploadedAudio;
    }

    if (dto.cost) {
      let sessionCost = await this.sessionCostRepository.findOne({ where: { sessionId } });

      if (sessionCost) {
        sessionCost.totalInputTokens = dto.cost.totalInputTokens ?? sessionCost.totalInputTokens;
        sessionCost.totalOutputTokens = dto.cost.totalOutputTokens ?? sessionCost.totalOutputTokens;
        sessionCost.totalTokens = dto.cost.totalTokens ?? sessionCost.totalTokens;
        sessionCost.totalInputCost = dto.cost.totalInputCost || sessionCost.totalInputCost;
        sessionCost.totalOutputCost = dto.cost.totalOutputCost || sessionCost.totalOutputCost;
        sessionCost.totalSessionCost = dto.cost.totalSessionCost || sessionCost.totalSessionCost;
        sessionCost.operations = dto.cost.operations || sessionCost.operations;
      } else {
        sessionCost = this.sessionCostRepository.create({
          sessionId,
          ...dto.cost,
        });
      }

      await this.sessionCostRepository.save(sessionCost);
      session.sessionCosting = sessionCost;
    }

    await this.sessionRepository.save(session);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: session,
    };
  }

  async addNoteToSession(sessionId: number, createNoteBody: AddNoteDto): Promise<ApiMessageData> {
    const { content } = createNoteBody;
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);

    let note = await this.noteRepository.findOne({ where: { sessionId } });
    if (note) note.content = (content as Record<string, string>) || note.content;
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
    if (doctorNote) doctorNote.content = (content as Record<string, string>) || doctorNote.content;
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

    let diagnosisCodes = await this.diagnosisCodesRepository.findOne({ where: { sessionId } });
    if (diagnosisCodes) diagnosisCodes.content = (content as Record<string, string>) || diagnosisCodes.content;
    else diagnosisCodes = this.diagnosisCodesRepository.create({ sessionId, content });

    diagnosisCodes = await this.diagnosisCodesRepository.save(diagnosisCodes);
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
      transcript.content = (content as Record<string, string>) || transcript.content;
    } else {
      if (!sessionId || !assemblyId || !content) throw new NotFoundException(SessionErrorMessages.missingTrancriptFields);
      transcript = this.transcriptRepository.create({ sessionId, assemblyId, content });
    }
    transcript = await this.transcriptRepository.save(transcript);
    session.status = SessionStatusEnum.COMPLETED;
    session.duration = duration || session.duration;
    session.transcript = transcript;

    await this.sessionRepository.save(session);

    return { message: SuccessResponseMessages.successGeneral, data: transcript };
  }

  async uploadSessionAudio(sessionId: number, audioFile: Express.Multer.File): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    if (session.audioFile) await this.storageProvider.deleteFile(session.audioFile);
    const uploadedImage = await this.storageProvider.uploadFile(audioFile);
    session.audioFile = uploadedImage;
    await this.sessionRepository.save(session);
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async getSessions(getSessionsDto: GetSessionsDto, userId: number = undefined): Promise<ApiMessageDataPagination> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);
    const { query, page, limit, sort = 'DESC', patientId, startDate, endDate } = getSessionsDto;

    let qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.note', 'note')
      .leftJoinAndSelect('session.transcript', 'transcript')
      .leftJoinAndSelect('session.doctorNotes', 'doctorNotes')
      .leftJoinAndSelect('session.diagnosisCodes', 'diagnosisCodes')
      .leftJoinAndSelect('session.patient', 'patient')
      .orderBy('session.createdAt', sort);

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

    // Apply organization-based filtering
    qb = await this.dataAccessService.applySessionsOrganizationFilter(qb, user, userId, 'patient');
    if (patientId) qb.andWhere('session.patientId = :patientId', { patientId });

    if (startDate) qb.andWhere('session.createdAt >= :startDate', { startDate: moment(startDate).utc().startOf('day').toDate() });
    if (endDate) qb.andWhere('session.createdAt <= :endDate', { endDate: moment(endDate).utc().endOf('day').toDate() });

    qb.skip((page - 1) * limit).take(limit);

    const [sessions, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    for (const session of sessions) {
      session.patient = undefined;
    }
    return { message: SuccessResponseMessages.successGeneral, data: sessions, page: page, total: total, lastPage: lastPage };
  }

  async getSession(sessionId: number, userId: number = undefined): Promise<ApiMessageData> {
    let user = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role', 'organization'] });
    }

    const where = userId !== undefined && !user?.clerkOrganizationId ? { id: sessionId, userId } : { id: sessionId };
    const session = await this.sessionRepository.findOne({ where, relations: ['note', 'transcript', 'doctorNotes', 'diagnosisCodes', 'patient'] });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async updateSessionStatus(sessionId: number, updateSessionDto: UpdateSessionDto, userId: number = undefined): Promise<ApiMessageData> {
    let user = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role', 'organization'] });
    }
    const { status } = updateSessionDto;
    const where = userId !== undefined && !user?.clerkOrganizationId ? { id: sessionId, userId } : { id: sessionId };
    const session = await this.sessionRepository.findOne({ where, relations: ['note', 'transcript', 'doctorNotes', 'diagnosisCodes', 'patient'] });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    session.status = status;
    await this.sessionRepository.save(session);
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }
}
