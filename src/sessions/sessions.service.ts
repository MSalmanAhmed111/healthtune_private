import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, Note, Transcript, DoctorNotes, DiagnosisCodes, FileStorage, Patient, Setting, User, UserPlanUsage, SessionCosting, Appointment, UserPlan } from '@entities';
import { Between, Brackets, Repository, QueryFailedError } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, AppointmentStatus, PlanFeatureNameEnum, SessionStatusEnum, SortEnum } from '@types';
import { CreateSessionDto, AddNoteDto, AddTranscriptDto, GetSessionStatsDto, GetSessionsDto, UpdateSessionDto, AddSessionDetailsDto, CreateSessionFeedbackDto, PaginationQueryDto } from 'src/dto';
import { PatientErrorMessages, SessionErrorMessages, SuccessResponseMessages } from '@messages';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { StorageProviderInterface } from 'src/common/providers';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';
import { DataAccessService } from 'src/common/services/data-access.service';
import { PlanUsageService } from 'src/common/services/plan-usage.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { SessionFeedback } from './entity/session-feedback.entity';
import moment from 'moment';

@Injectable()
export class SessionService {
  private readonly logger = new Logger('SessionService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
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
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    @InjectRepository(SessionFeedback)
    private readonly sessionFeedbackRepository: Repository<SessionFeedback>,
    private readonly fileStorageService: FileStorageService,
    private readonly roleBasedAccessService: RoleBasedAccessService,
    private readonly dataAccessService: DataAccessService,
    private readonly planUsageService: PlanUsageService,
    private readonly encryptionService: EncryptionService,
    @Inject('StorageProvider')
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  async createSession(reqBody: CreateSessionDto, userId: number): Promise<ApiMessageData> {
    const { patientFirstName, patientLastName, sessionType, noteFormat, language, appointmentId } = reqBody;
    let { patientId, sex } = reqBody;
    let patientName = null;

    const user = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: [
        'userPlan', 
        'userPlan.usage', 
        'userPlan.usage.planFeatureProperty', 
        'userPlan.usage.planFeatureProperty.feature',
        'organization',
        'organization.userPlan',
        'organization.userPlan.usage',
        'organization.userPlan.usage.planFeatureProperty',
        'organization.userPlan.usage.planFeatureProperty.feature'
      ] 
    });
    
    let appointment = null;
    if (appointmentId) {
      appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
      if (!appointment) throw new NotFoundException(SessionErrorMessages.appointmentNotFound);
    }

    const belongsToOrg = user.organizationId !== null && user.organizationId !== undefined;
    const orgHasUserPlan = belongsToOrg && user.organization?.userPlan && user.organization.userPlan.id;
    const userHasUserPlan = user.userPlan && user.userPlan.id;

    let subscriberId: number | null = null;
    if (orgHasUserPlan) {
      subscriberId = user.organizationId; // Organization plan has priority
    } else if (userHasUserPlan) {
      subscriberId = user.id; // Fall back to individual plan
    }

    if (subscriberId) {
      const limitCheck = await this.planUsageService.checkUsageLimitBeforeIncrement(
        subscriberId,
        PlanFeatureNameEnum.SESSION_CREATION
      );
      if (!limitCheck.canUse) {
        throw new BadRequestException(limitCheck.reason);
      }

      try {
        // Track usage consumption
        this.logger.debug(`[SESSION_CREATION] Tracking usage for subscriberId: ${subscriberId}`);
        const newUsageCount = await this.planUsageService.trackUsage(subscriberId, PlanFeatureNameEnum.SESSION_CREATION, 1);
        this.logger.debug(`[SESSION_CREATION] Usage tracked successfully. New count: ${newUsageCount}`);
      } catch (error) {
        this.logger.error(`[SESSION_CREATION] Failed to track user plan usage: ${error.message}`);
        this.logger.error(`[SESSION_CREATION] Stack: ${error.stack}`);
        // Don't block session creation if tracking fails
      }
    }
    // If no plan is active, allow session creation without usage tracking

    const patientRecordSettings = await this.settingRepository.findOne({ where: { name: 'Enable patient records', userId } });
    // Default to true if setting doesn't exist (backward compatibility)
    const patientRecordsEnabled = patientRecordSettings?.value !== false;
    
    if (!patientRecordsEnabled) {
      throw new NotFoundException(SessionErrorMessages.patientRecordSettingError);
    }

    if (patientId) {
      const whereCondition = { id: patientId };
      let patient = null;
      if (user.clerkOrganizationId !== null) {
        patient = await this.patientRepository.findOne({ where: whereCondition });
      } else {
        patient = await this.patientRepository.findOne({ where: { ...whereCondition, doctorId: userId } });
      }
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

      patient = this.decryptPatientData(patient);
      patientName = patient.firstName + ' ' + patient.lastName;
      sex = patient.gender;
    } else if (patientFirstName && patientLastName) {
      if (patientRecordsEnabled) {
        //let mreCount = '0';
        const fetchedItem = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
        const mreCount = fetchedItem.id;
        //if (patient) mreCount = patient.id.toString();
        const mreNumber = `MRE-${(mreCount + 1).toString().padStart(7, '0')}`;
        let createdPatient = this.patientRepository.create({ firstName: patientFirstName, lastName: patientLastName, mreNumber, gender: sex, doctorId: userId, createdAt: moment().utc().toDate(), updatedAt: moment().utc().toDate() });
        createdPatient = await this.patientRepository.save(createdPatient);
        patientId = createdPatient.id;
        patientName = createdPatient.firstName + ' ' + createdPatient.lastName;
      } else patientName = patientFirstName + ' ' + patientLastName;
    } else {
      throw new NotFoundException(SessionErrorMessages.patientIdOrNameRequired);
    }

    const session = this.sessionRepository.create({ patientId, patientName, sex, sessionType, noteFormat, language, userId, appointmentId });
    
    try {
      await this.sessionRepository.save(session);
    } catch (error) {
      // Handle duplicate key constraint violation
      if (error instanceof QueryFailedError && error.driverError?.code === '23505') {
        throw new BadRequestException(SessionErrorMessages.sessionAlreadyExists);
      }
      
      // Re-throw other errors
      throw error;
    }

    if (appointment) {
      appointment.status = AppointmentStatus.InProgress;
      await this.appointmentRepository.save(appointment);
    }

    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  async updateSessionDetails(sessionId: number, dto: AddSessionDetailsDto, audioFile?: Express.Multer.File): Promise<ApiMessageData> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(SessionErrorMessages.sessionNotExists);
    // Update Note
    if (dto.summary) {
      if (dto.summary && typeof dto.summary === 'string') dto.summary = { content: dto.summary } as string | Record<string, string>;
      session.summary = dto.summary as Record<string, string>;
    }

    if (dto.note) {
      let note: any = await this.noteRepository.findOne({ where: { sessionId } });
      if (dto.note && dto.note.content && typeof dto.note.content === 'string') dto.note.content = { note: dto.note.content };
      if (note) note.content = (dto.note.content as Record<string, string>) || note.content;
      else note = this.noteRepository.create({ sessionId, content: dto.note.content as Record<string, string> });
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

    if (dto.noteFormat) session.noteFormat = dto.noteFormat;

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
    const { query, page, limit, sort = 'DESC', patientId, startDate, endDate, userIdFilter } = getSessionsDto;

    let qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.note', 'note')
      .leftJoinAndSelect('session.transcript', 'transcript')
      .leftJoinAndSelect('session.doctorNotes', 'doctorNotes')
      .leftJoinAndSelect('session.diagnosisCodes', 'diagnosisCodes')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.user', 'user')
      .select(['session', 'note', 'transcript', 'doctorNotes', 'diagnosisCodes', 'patient', 'user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .orderBy('session.createdAt', sort);

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(session.patientName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.sessionType) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(session.language) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.mreNumber, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.firstName, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(patient.lastName, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(user.email, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(user.firstName, '')) LIKE LOWER(:query)`, { query: `%${query}%` })
            .orWhere(`LOWER(COALESCE(user.lastName, '')) LIKE LOWER(:query)`, { query: `%${query}%` });
        }),
      );
    }

    // Apply organization-based filtering
    qb = await this.dataAccessService.applySessionsOrganizationFilter(qb, user, userId, 'session');
    if (patientId) qb.andWhere('session.patientId = :patientId', { patientId });

    if (userIdFilter) qb.andWhere('session.userId = :userIdFilter', { userIdFilter });

    if (startDate) qb.andWhere('session.createdAt >= :startDate', { startDate: moment(startDate).utc().startOf('day').toDate() });
    if (endDate) qb.andWhere('session.createdAt <= :endDate', { endDate: moment(endDate).utc().endOf('day').toDate() });

    qb.skip((page - 1) * limit).take(limit);

    const [sessions, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    for (const session of sessions) {
      // Try to decrypt patientName, reconstruct from patient if it fails
      if (session.patient) {
        session.patient = this.decryptPatientData(session.patient);
        const decryptedName = this.decryptField(session.patientName);
        if (decryptedName === session.patientName && session.patientName.includes(':')) {
          // Decryption failed, reconstruct from patient
          session.patientName = `${session.patient.firstName} ${session.patient.lastName}`;
        } else {
          session.patientName = decryptedName;
        }
      } else {
        // No patient data, try to decrypt patientName as-is
        session.patientName = this.decryptField(session.patientName);
      }
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
    
    // Decrypt patient data if present
    if (session.patient) {
      session.patient = this.decryptPatientData(session.patient);
      // If patientName cannot be decrypted, reconstruct it from patient data
      const decryptedName = this.decryptField(session.patientName);
      if (decryptedName === session.patientName && session.patientName.includes(':')) {
        // Decryption failed (result same as input and still has colons), rebuild from patient
        session.patientName = `${session.patient.firstName} ${session.patient.lastName}`;
      } else {
        session.patientName = decryptedName;
      }
    } else {
      // No patient data, try to decrypt patientName as-is
      session.patientName = this.decryptField(session.patientName);
    }
    
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

    if (session.appointmentId) {
      const appointment = await this.appointmentRepository.findOne({ where: { id: session.appointmentId } });
      if (appointment) {
        appointment.status = AppointmentStatus.Completed;
        await this.appointmentRepository.save(appointment);
      }
    }
    return { message: SuccessResponseMessages.successGeneral, data: session };
  }

  private decryptField(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    // Check if value looks like encrypted data (iv:authTag:encrypted format)
    // Split on first 2 colons only, encrypted data itself may contain colons
    if (!value.includes(':')) {
      return value; // Not encrypted, return as is
    }
    try {
      const decrypted = this.encryptionService.decrypt(value);
      return decrypted;
    } catch (error) {
      // If decryption fails, return the original value
      return value;
    }
  }

  private decryptPatientData(patient: any): any {
    const phiFields = [
      'mreNumber',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'medicalHistory',
      'allergies',
      'currentMedications',
      'chronicDiseases',
      'surgicalHistory',
      'emergencyContactName',
      'emergencyContactPhone',
      'insuranceProvider',
      'insurancePolicyNumber',
      'admissionReason',
    ];

    const decrypted = { ...patient };
    phiFields.forEach((field) => {
      if (decrypted[field] && typeof decrypted[field] === 'string' && decrypted[field].includes(':')) {
        try {
          decrypted[field] = this.encryptionService.decrypt(decrypted[field]);
        } catch (error) {
          // If decryption fails, keep original value
        }
      }
    });

    return decrypted;
  }

  async createSessionFeedback(sessionId: number, reqBody: CreateSessionFeedbackDto, userId: number): Promise<ApiMessageData> {
    // Verify session exists and user has access
    const session = await this.sessionRepository.findOne({ 
      where: { id: sessionId },
      relations: ['user']
    });

    if (!session) {
      throw new NotFoundException(SessionErrorMessages.sessionNotFound);
    }

    // Check if user has access to this session
    if (session.userId !== userId) {
      throw new ForbiddenException(SessionErrorMessages.noAccessToSession);
    }

    // Create feedback
    const feedback = this.sessionFeedbackRepository.create({
      feedback: reqBody.feedback,
      sessionId: sessionId,
      userId: userId
    });

    await this.sessionFeedbackRepository.save(feedback);

    return {
      message: SuccessResponseMessages.feedbackSubmitted,
      data: {
        id: feedback.id,
        feedback: feedback.feedback,
        sessionId: feedback.sessionId,
        createdAt: feedback.createdAt
      }
    };
  }

  async getSessionFeedbacks(sessionId: number, userId: number, queryParams: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    // Verify session exists and user has access
    const session = await this.sessionRepository.findOne({ 
      where: { id: sessionId },
      relations: ['user']
    });

    if (!session) {
      throw new NotFoundException(SessionErrorMessages.sessionNotFound);
    }

    // Check if user has access to this session
    if (session.userId !== userId) {
      throw new ForbiddenException(SessionErrorMessages.noAccessToSession);
    }

    // Get all feedbacks for this session with pagination
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 10;
    const sortOrder = queryParams.sort || SortEnum.DESC;

    


    const qb = this.sessionFeedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.user', 'user')
      .where('feedback.sessionId = :sessionId', { sessionId })
      .orderBy('feedback.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [feedbacks, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.dataFetchedSuccessfully,
      data: feedbacks.map(feedback => ({
        id: feedback.id,
        feedback: feedback.feedback,
        sessionId: feedback.sessionId,
        userId: feedback.userId,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      })),
      page,
      total,
      lastPage
    };
  }
}
