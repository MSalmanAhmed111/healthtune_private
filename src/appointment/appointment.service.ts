import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SortEnum } from '@types';
import { CreateAppointmentDto, GetAppointmentsDto, PaginationQueryDto, UpdateAppointmentDto } from 'src/dto';
import { AppointmentErrorMessages, PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { Appointment, Patient, User } from '@entities';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';
import { DataAccessService } from 'src/common/services/data-access.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleBasedAccessService: RoleBasedAccessService,
    private readonly dataAccessService: DataAccessService,
  ) {}

  async createAppointment(reqBody: CreateAppointmentDto, doctorId: number = undefined): Promise<ApiMessageData> {
    const { patientId, appointmentDate, appointmentType, consultationFee, location, isTelemedicine, roomNumber, notes, color, duration } = reqBody;
    if (reqBody.doctorId) doctorId = reqBody.doctorId;
    let where: any = {};

    if (doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not exists');

      const existingDoctorAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: new Date(appointmentDate), doctorId } });
      if (existingDoctorAppointment) throw new BadRequestException(AppointmentErrorMessages.doctorAppointmentAlreadyScheduled);
      if (doctor.clerkOrganizationId) where = { id: patientId, organizationId: doctor.organizationId };
      else where = { id: patientId, doctorId: doctor.id };
    } else {
      where = { id: patientId };
    }

    if (appointmentDate && new Date(appointmentDate).getTime() < Date.now()) throw new BadRequestException(AppointmentErrorMessages.appointmentDateInPast);

    let patient = await this.patientRepository.findOne({ where });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    const existingPatientAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: new Date(appointmentDate), patientId } });
    if (existingPatientAppointment) throw new BadRequestException(AppointmentErrorMessages.patientAppointmentAlreadyScheduled);

    let appointment = this.appointmentRepository.create({
      patientId,
      doctorId,
      appointmentDate,
      appointmentType,
      consultationFee,
      location,
      isTelemedicine,
      roomNumber,
      notes,
      color,
      duration,
    });
    appointment = await this.appointmentRepository.save(appointment);
    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }
  async updateAppointment(appointmentId: number, reqBody: UpdateAppointmentDto, doctorId: number = undefined): Promise<ApiMessageData> {
    const { patientId, appointmentDate, appointmentType, consultationFee, location, isTelemedicine, roomNumber, notes, status, color, duration } = reqBody;
    if (reqBody.doctorId) doctorId = reqBody.doctorId;
    let where: any;
    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);

    if (doctorId && doctorId !== appointment.doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new BadRequestException('Doctor not exists');

      const existingDoctorAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(appointment.appointmentDate), doctorId: doctorId, id: Not(appointmentId) } });
      if (existingDoctorAppointment) throw new BadRequestException(AppointmentErrorMessages.doctorAppointmentAlreadyScheduled);
      if (doctor.clerkOrganizationId) where = { id: patientId, organizationId: doctor.organizationId };
      else where = { id: patientId, doctorId: doctor.id };
    } else {
      where = { id: patientId };
    }

    if (patientId && patientId !== appointment.patientId) {
      let patient = await this.patientRepository.findOne({ where });
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

      const existingPatientAppointment = await this.appointmentRepository.findOne({
        where: { appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(appointment.appointmentDate), patientId: patientId, id: Not(appointmentId) },
      });
      if (existingPatientAppointment) throw new BadRequestException(AppointmentErrorMessages.patientAppointmentAlreadyScheduled);
    }

    if (appointmentDate && appointmentDate !== appointment.appointmentDate) {
      const existingDoctorAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: appointmentDate, doctorId: doctorId || appointment.doctorId, id: Not(appointmentId) } });
      if (existingDoctorAppointment) throw new BadRequestException(AppointmentErrorMessages.doctorAppointmentAlreadyScheduled);
      const existingPatientAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: appointmentDate, patientId: patientId || appointment.patientId, id: Not(appointmentId) } });
      if (existingPatientAppointment) throw new BadRequestException(AppointmentErrorMessages.patientAppointmentAlreadyScheduled);
    }

    appointment.patientId = patientId || appointment.patientId;
    appointment.doctorId = doctorId || appointment.doctorId;
    appointment.appointmentDate = appointmentDate || appointment.appointmentDate;
    appointment.appointmentType = appointmentType || appointment.appointmentType;
    appointment.consultationFee = consultationFee || appointment.consultationFee;
    appointment.location = location || appointment.location;
    appointment.isTelemedicine = isTelemedicine || appointment.isTelemedicine;
    appointment.roomNumber = roomNumber ?? appointment.roomNumber;
    appointment.status = status || appointment.status;
    appointment.notes = notes || appointment.notes;
    appointment.color = color || appointment.color;
    appointment.duration = duration || appointment.duration;

    await this.appointmentRepository.save(appointment);

    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }

  async getAppointments(getAppointmentDto: GetAppointmentsDto, userId: number = undefined): Promise<ApiMessageDataPagination> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);
    const { query, page = 1, limit = 10, isCompleted = false, patientId, status, appointmentType, paymentStatus, minConsultationFee, maxConsultationFee, isTelemedicine, location, startDate, endDate, sort = SortEnum.DESC } = getAppointmentDto;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.session', 'session')
      .leftJoinAndMapOne('appointment.doctor', User, 'doctor', 'doctor.id = appointment.doctorId')
      .leftJoinAndMapOne('appointment.patient', Patient, 'patient', 'patient.id = appointment.patientId')
      .select(['appointment', 'doctor.firstName', 'doctor.lastName', 'doctor.username', 'doctor.email', 'patient.mreNumber', 'patient.firstName', 'patient.lastName', 'patient.email', 'session']);

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(patient.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.mreNumber) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.email) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(doctor.email) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(doctor.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(doctor.lastName) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }

    // Apply organization-based filtering
    this.dataAccessService.applyAppointmentsOrganizationFilter(qb, user, userId, 'patient');
    if (patientId) qb.andWhere('appointment.patientId = :patientId', { patientId });
    if (status) qb.andWhere('appointment.status = :status', { status });
    if (appointmentType) qb.andWhere('LOWER(appointment.appointmentType) = LOWER(:appointmentType)', { appointmentType });
    if (paymentStatus) qb.andWhere('LOWER(appointment.paymentStatus) = LOWER(:paymentStatus)', { paymentStatus });
    if (isTelemedicine !== undefined) qb.andWhere('appointment.isTelemedicine = :isTelemedicine', { isTelemedicine });
    if (location) qb.andWhere('LOWER(appointment.location) = LOWER(:location)', { location });

    if (minConsultationFee) qb.andWhere('appointment.consultationFee >= :minConsultationFee', { minConsultationFee });
    if (maxConsultationFee) qb.andWhere('appointment.consultationFee <= :maxConsultationFee', { maxConsultationFee });

    if (startDate) qb.andWhere('appointment.appointmentDate >= :startDate', { startDate });
    if (endDate) qb.andWhere('appointment.appointmentDate <= :endDate', { endDate });

    qb.andWhere('appointment.isCompleted = :isCompleted', { isCompleted });

    qb.orderBy('appointment.createdAt', sort);
    qb.skip((page - 1) * limit).take(limit);

    const [appointments, total] = await Promise.all([
      qb.getMany(), // Get the data
      qb.getCount(), // Get the count
    ]);
    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: appointments,
      page,
      total,
      lastPage,
    };
  }

  async getAppointment(appointmentId: number, userId: number = undefined): Promise<ApiMessageData> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);

    const appointment = (await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'patient.doctor', 'session'],
    })) as Appointment & { doctor?: object; patient?: object };

    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);

    // Check if user can access this appointment
    if (!this.dataAccessService.canAccessResource(user, appointment.doctorId, user.clerkOrganizationId)) {
      throw new ForbiddenException('You do not have permission to access this appointment');
    }
    if (appointment.doctorId) {
      const doctor = await this.userRepository.findOne({ where: { id: appointment.doctorId }, select: { firstName: true, lastName: true, email: true } });
      appointment.doctor = doctor;
    }
    if (appointment.patientId) {
      const patient = await this.patientRepository.findOne({ where: { id: appointment.patientId }, select: { firstName: true, lastName: true, mreNumber: true, email: true } });
      appointment.patient = patient;
    }
    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }

  async deleteAppointment(appointmentId: number, userId: number = undefined): Promise<ApiMessageData> {
    const where = userId !== undefined ? { id: appointmentId, doctorId: userId } : { id: appointmentId };
    const appointment = await this.appointmentRepository.findOne({ where });
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);
    await this.appointmentRepository.delete({ id: appointmentId });
    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }
}
