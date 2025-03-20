import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, SortEnum } from '@types';
import { CreateAppointmentDto, GetAppointmentsDto, PaginationQueryDto, UpdateAppointmentDto } from 'src/dto';
import { AppointmentErrorMessages, PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { Appointment, Patient, User } from '@entities';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async createAppointment(reqBody: CreateAppointmentDto, doctorId: number = undefined): Promise<ApiMessageData> {
    const { patientId, appointmentDate, appointmentType, consultationFee, location, isTelemedicine, roomNumber, notes, color, duration } = reqBody;

    let patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    if (doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not exists');

      const existingDoctorAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: new Date(appointmentDate), doctorId } });
      if (existingDoctorAppointment) throw new BadRequestException(AppointmentErrorMessages.doctorAppointmentAlreadyScheduled);
    }

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

    const where = doctorId !== undefined ? { id: appointmentId, doctorId } : { id: appointmentId };
    const appointment = await this.appointmentRepository.findOne({ where });
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);

    if (patientId && patientId !== appointment.patientId) {
      let patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

      const existingPatientAppointment = await this.appointmentRepository.findOne({
        where: { appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(appointment.appointmentDate), patientId: patientId, id: Not(appointmentId) },
      });
      if (existingPatientAppointment) throw new BadRequestException(AppointmentErrorMessages.patientAppointmentAlreadyScheduled);
    }

    if (doctorId && doctorId !== appointment.doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new BadRequestException('Doctor not exists');

      const existingDoctorAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(appointment.appointmentDate), doctorId: doctorId, id: Not(appointmentId) } });
      if (existingDoctorAppointment) throw new BadRequestException(AppointmentErrorMessages.doctorAppointmentAlreadyScheduled);
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
    const { query, page = 1, limit = 10, patientId, status, appointmentType, paymentStatus, minConsultationFee, maxConsultationFee, isTelemedicine, location, startDate, endDate, sort = SortEnum.DESC } = getAppointmentDto;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndMapOne('appointment.doctor', User, 'doctor', 'doctor.id = appointment.doctorId')
      .leftJoinAndMapOne('appointment.patient', Patient, 'patient', 'patient.id = appointment.patientId')
      .select(['appointment', 'doctor.firstName', 'doctor.lastName', 'doctor.username', 'doctor.email', 'patient.mreNumber', 'patient.firstName', 'patient.lastName', 'patient.email']);

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

    if (userId) qb.andWhere('appointment.doctorId = :userId', { userId });
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
    const where = userId !== undefined ? { id: appointmentId, doctorId: userId } : { id: appointmentId };
    const appointment = (await this.appointmentRepository.findOne({ where })) as Appointment & { doctor?: object; patient?: object };
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);
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
