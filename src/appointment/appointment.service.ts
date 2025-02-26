import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async createAppointment(reqBody: CreateAppointmentDto): Promise<ApiMessageData> {
    const { patientId, doctorId, appointmentDate, appointmentType, consultationFee, location, isTelemedicine, roomNumber, notes } = reqBody;

    let patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    if (doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not exists');
    }

    const existingAppointment = await this.appointmentRepository.findOne({ where: { appointmentDate: new Date(appointmentDate), doctorId, patientId } });
    if (existingAppointment) throw new NotFoundException(AppointmentErrorMessages.appointmentAlreadyScheduled);

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
    });
    appointment = await this.appointmentRepository.save(appointment);
    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }
  async updateAppointment(appointmentId: number, reqBody: UpdateAppointmentDto): Promise<ApiMessageData> {
    const { patientId, doctorId, appointmentDate, appointmentType, consultationFee, location, isTelemedicine, roomNumber, notes, status } = reqBody;

    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);

    if (patientId) {
      let patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    }

    if (doctorId) {
      let doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not exists');
    }

    const existingAppointment = await this.appointmentRepository.findOne({
      where: { appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(appointment.appointmentDate), doctorId: doctorId || appointment.doctorId, patientId: patientId || appointment.patientId, id: Not(appointmentId) },
    });
    if (existingAppointment) throw new NotFoundException(AppointmentErrorMessages.appointmentAlreadyScheduled);

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

    await this.appointmentRepository.save(appointment);

    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }

  async getAppointments(getAppointmentDto: GetAppointmentsDto): Promise<ApiMessageDataPagination> {
    const { query, page = 1, limit = 10, doctorId, patientId, status, appointmentType, paymentStatus, minConsultationFee, maxConsultationFee, isTelemedicine, location, startDate, endDate, sort = SortEnum.DESC } = getAppointmentDto;

    const qb = this.appointmentRepository.createQueryBuilder('appointment').leftJoinAndSelect('appointment.doctor', 'doctor').leftJoinAndSelect('appointment.patient', 'patient');

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(patient.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(doctor.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(doctor.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(appointment.reason) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }

    if (doctorId) qb.andWhere('appointment.doctorId = :doctorId', { doctorId });
    if (patientId) qb.andWhere('appointment.patientId = :patientId', { patientId });
    if (status) qb.andWhere('appointment.status = :status', { status });
    if (appointmentType) qb.andWhere('LOWER(appointment.appointmentType) = LOWER(:appointmentType)', { appointmentType });
    if (paymentStatus) qb.andWhere('LOWER(appointment.paymentStatus) = LOWER(:paymentStatus)', { paymentStatus });
    if (isTelemedicine !== undefined) qb.andWhere('appointment.isTelemedicine = :isTelemedicine', { isTelemedicine });
    if (location) qb.andWhere('LOWER(appointment.location) = LOWER(:location)', { location });

    if (minConsultationFee) qb.andWhere('appointment.consultationFee >= :minConsultationFee', { minConsultationFee });
    if (maxConsultationFee) qb.andWhere('appointment.consultationFee <= :maxConsultationFee', { maxConsultationFee });

    if (startDate) qb.andWhere('appointment.startTime >= :startDate', { startDate });
    if (endDate) qb.andWhere('appointment.endTime <= :endDate', { endDate });

    qb.orderBy('appointment.createdAt', sort);
    qb.skip((page - 1) * limit).take(limit);

    const [appointments, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: appointments,
      page,
      total,
      lastPage,
    };
  }

  async getAppointment(appointmentId: number): Promise<ApiMessageData> {
    const appointment = (await this.appointmentRepository.findOne({ where: { id: appointmentId } })) as Appointment & { doctor?: object; patient?: object };
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

  async deleteAppointment(appointmentId: number): Promise<ApiMessageData> {
    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(AppointmentErrorMessages.appointmentNotExists);
    await this.appointmentRepository.delete({ id: appointmentId });
    return { message: SuccessResponseMessages.successGeneral, data: appointment };
  }
}
