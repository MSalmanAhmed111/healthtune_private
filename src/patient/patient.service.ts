import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, AppointmentStatus, InsuranceTypeEnum, SettingNames, UserRolesEnum } from '@types';
import { CreatePatientDto, GetPatientsDto, UpdatePatientDto } from 'src/dto';
import { ErrorResponseMessages, PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { Appointment, FileStorage, Patient, Setting, User } from '@entities';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';
import { DataAccessService } from 'src/common/services/data-access.service';
import moment from 'moment-timezone';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    private readonly fileStorageService: FileStorageService,
    private readonly roleBasedAccessService: RoleBasedAccessService,
    private readonly dataAccessService: DataAccessService,
  ) {}

  async createPatient(reqBody: CreatePatientDto, userId: number): Promise<ApiMessageData> {
    // Get user and check permissions
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName, email, dateOfBirth, gender, maritalStatus, nationality, occupation, profileImage, address, medicalDetails, contactDetails, admissionDetails, insuranceDetails, languagePreference } = reqBody;
    //let mreCount = '0';
    let fetchedItem = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
    let mreCount = fetchedItem?.id || 0; // Use the last patient's ID or 0 if no patients exist
    if (email) {
      const emailExists = await this.patientRepository.findOne({ where: { email, doctorId: userId } });
      if (emailExists) throw new NotFoundException(PatientErrorMessages.emailExists);
    }
    //if (patient) mreCount = patient.id.toString();
    const mreNumber = `MRE-${(+mreCount + 1).toString().padStart(7, '0')}`;
    let patient = this.patientRepository.create({
      mreNumber,
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      occupation,
      doctorId: userId,
      organizationId: user.organizationId,
      languagePreference,
      address: address
        ? {
            streetAddress: address.streetAddress || null,
            city: address.city || null,
            area: address.area || null,
            postalCode: address.postalCode || null,
            country: address.country || null,
          }
        : null,
      medicalDetails: medicalDetails
        ? {
            bloodType: medicalDetails.bloodType || null,
            medicalHistory: medicalDetails.medicalHistory || null,
            allergies: medicalDetails.allergies || null,
            currentMedications: medicalDetails.currentMedications || null,
            chronicDiseases: medicalDetails.chronicDiseases || null,
            surgicalHistory: medicalDetails.surgicalHistory || null,
            isSmoker: medicalDetails.isSmoker !== undefined ? medicalDetails.isSmoker : null,
            isAlcoholic: medicalDetails.isAlcoholic !== undefined ? medicalDetails.isAlcoholic : null,
          }
        : null,
      contactDetails: contactDetails
        ? {
            phoneNumber: contactDetails.phoneNumber || null,
            emergencyContactName: contactDetails.emergencyContactName || null,
            emergencyContactRelationship: contactDetails.emergencyContactRelationship || null,
            emergencyContactPhone: contactDetails.emergencyContactPhone || null,
          }
        : null,
      admissionDetails: admissionDetails
        ? {
            admissionDate: admissionDetails.admissionDate || null,
            admissionReason: admissionDetails.admissionReason || null,
            roomNumber: admissionDetails.roomNumber || null,
            isDischarged: admissionDetails.isDischarged || null,
            dischargeDate: admissionDetails.dischargeDate !== undefined ? admissionDetails.dischargeDate : null,
          }
        : null,
      insuranceDetails: insuranceDetails
        ? {
            insuranceProvider: insuranceDetails.insuranceProvider || null,
            insurancePolicyNumber: insuranceDetails.insurancePolicyNumber || null,
            insuranceExpiryDate: insuranceDetails.insuranceExpiryDate || null,
            isInsured: insuranceDetails.isInsured !== undefined ? insuranceDetails.isInsured : true,
            effectiveDate: insuranceDetails.effectiveDate !== undefined ? insuranceDetails.effectiveDate : null,
            type: insuranceDetails.type || InsuranceTypeEnum.PRIVATE,
          }
        : null,
    });

    if (profileImage && profileImage !== patient.profileImage) {
      const imageExists = this.fileStorageRepository.findOne({ where: { id: profileImage } });
      if (!imageExists) throw new NotFoundException(ErrorResponseMessages.fileNotExists);
      patient.profileImage = profileImage;
    }

    patient = await this.patientRepository.save(patient);
    if (patient.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (image) patient.profileImage = { id: image.id, fileName: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }
  async updatePatient(patientId: number, reqBody: UpdatePatientDto): Promise<ApiMessageData> {
    const { firstName, lastName, dateOfBirth, gender, maritalStatus, nationality, occupation, profileImage, address, contactDetails, medicalDetails, insuranceDetails, admissionDetails } = reqBody;

    let patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    patient.firstName = firstName || patient.firstName;
    patient.lastName = lastName || patient.lastName;
    patient.dateOfBirth = dateOfBirth ?? patient.dateOfBirth;
    patient.gender = gender ?? patient.gender;
    patient.maritalStatus = maritalStatus ?? patient.maritalStatus;
    patient.nationality = nationality ?? patient.nationality;
    patient.occupation = occupation ?? patient.occupation;
    patient.address = address ? { ...patient.address, ...address } : patient.address;
    patient.contactDetails = contactDetails ? { ...patient.contactDetails, ...contactDetails } : patient.contactDetails;
    patient.medicalDetails = medicalDetails ? { ...patient.medicalDetails, ...medicalDetails } : patient.medicalDetails;
    patient.insuranceDetails = insuranceDetails ? { ...patient.insuranceDetails, ...insuranceDetails } : patient.insuranceDetails;
    patient.admissionDetails = admissionDetails ? { ...patient.admissionDetails, ...admissionDetails } : patient.admissionDetails;

    if (profileImage && profileImage !== patient.profileImage) {
      const imageExists = this.fileStorageRepository.findOne({ where: { id: profileImage as number } });
      if (!imageExists) throw new NotFoundException(ErrorResponseMessages.fileNotExists);
      if (patient.profileImage) {
        const previousImageExists = this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
        if (previousImageExists) await this.fileStorageService.deleteFileStorage(patient.profileImage as number);
      }
      patient.profileImage = profileImage;
    }

    patient = await this.patientRepository.save(patient);
    if (patient.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (image) patient.profileImage = { id: image.id, fileName: image.name };
    }

    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }

  async getPatientsByAppointment(getPatientDto: GetPatientsDto, userId: number): Promise<ApiMessageDataPagination> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);
    const { query, page = 1, limit = 10, gender, maritalStatus, nationality, sort = 'DESC', byTodayAppointment = false } = getPatientDto;

    let qb = this.patientRepository.createQueryBuilder('patient');

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(patient.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.mreNumber) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.email) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }

    // Apply organization-based filtering
    qb = await this.dataAccessService.applyPatientsOrganizationFilter(qb, user, userId, 'patient');

    if (gender) qb.andWhere('LOWER(patient.gender) = LOWER(:gender)', { gender });
    if (maritalStatus) qb.andWhere('LOWER(patient.maritalStatus) = LOWER(:maritalStatus)', { maritalStatus });
    if (nationality) qb.andWhere('LOWER(patient.nationality) = LOWER(:nationality)', { nationality });

    if (user.role.name === UserRolesEnum.DOCTOR) {
      const doctorSetting = await this.settingsRepository.findOne({
        where: { userId: userId, name: SettingNames.EnablePatientByAppointments },
      });

      if (doctorSetting?.value === true) {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        qb.innerJoinAndSelect('patient.appointments', 'appointment').andWhere('appointment.doctorId = :userId', { userId }).andWhere('appointment.appointmentDate BETWEEN :todayStart AND :todayEnd', {
          todayStart,
          todayEnd,
        });
      }
    }

    qb.skip((page - 1) * limit).take(limit);

    const [patients, total] = await qb.orderBy('patient.id', sort).getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    for (const patient of patients) {
      if (patient.profileImage) {
        const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
        if (image) patient.profileImage = { id: image.id, fileName: image.name };
      }
      const appointments = await this.appointmentRepository.find({ where: { patientId: patient.id, appointmentDate: MoreThanOrEqual(moment().subtract(20, 'minutes').toDate()), status: Not(AppointmentStatus.Completed) }, order: { appointmentDate: 'ASC' } });
      patient.appointments = appointments;
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: patients,
      page,
      total,
      lastPage,
    };
  }

  async getPatients(getPatientDto: GetPatientsDto, userId: number): Promise<ApiMessageDataPagination> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    // const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);
    const { query, page = 1, limit = 10, gender, maritalStatus, nationality, sort = 'DESC', byTodayAppointment = false } = getPatientDto;

    let qb = this.patientRepository.createQueryBuilder('patient');

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(patient.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.mreNumber) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(patient.email) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }

    // Apply organization-based filtering
    qb = await this.dataAccessService.applyPatientsOrganizationFilter(qb, user, userId, 'patient');

    if (gender) qb.andWhere('LOWER(patient.gender) = LOWER(:gender)', { gender });
    if (maritalStatus) qb.andWhere('LOWER(patient.maritalStatus) = LOWER(:maritalStatus)', { maritalStatus });
    if (nationality) qb.andWhere('LOWER(patient.nationality) = LOWER(:nationality)', { nationality });

    qb.skip((page - 1) * limit).take(limit);

    const [patients, total] = await qb.orderBy('patient.id', sort).getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    for (const patient of patients) {
      if (patient.profileImage) {
        const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
        if (image) patient.profileImage = { id: image.id, fileName: image.name };
      }
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: patients,
      page,
      total,
      lastPage,
    };
  }

  async getPatient(patientId: number, userId: number): Promise<ApiMessageData> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role', 'role.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);

    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['doctor'],
    });

    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    // Check if user can access this patient
    if (!this.dataAccessService.canAccessResource(user, patient.doctorId, user.clerkOrganizationId)) {
      throw new ForbiddenException('You do not have permission to access this patient');
    }

    if (patient.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (image) patient.profileImage = { id: image.id, fileName: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }

  async deletePatient(patientId: number, userId: number): Promise<ApiMessageData> {
    // Get user and organization context
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    //const userContext = await this.roleBasedAccessService.getUserOrganizationContext(user);

    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['doctor'],
    });

    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);

    // Check if user can access this patient
    if (!this.dataAccessService.canAccessResource(user, patient.doctorId, user.clerkOrganizationId)) {
      throw new ForbiddenException('You do not have permission to delete this patient');
    }

    if (patient.profileImage) {
      const previousImageExists = this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (previousImageExists) await this.fileStorageService.deleteFileStorage(patient.profileImage as number);
    }
    await this.patientRepository.delete({ id: patientId });
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }
}
