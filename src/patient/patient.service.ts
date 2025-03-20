import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreatePatientDto, GetPatientsDto, UpdatePatientDto } from 'src/dto';
import { ErrorResponseMessages, PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { FileStorage, Patient } from '@entities';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    private readonly fileStorageService: FileStorageService,
  ) { }

  async createPatient(reqBody: CreatePatientDto, doctorId: number): Promise<ApiMessageData> {
    const { firstName, lastName, email, dateOfBirth, gender, maritalStatus, nationality, occupation, profileImage, address, medicalDetails, contactDetails, admissionDetails, insuranceDetails } = reqBody;
    let mreCount = '0';
    let patient = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
    if (email) {
      const emailExists = await this.patientRepository.findOne({ where: { email, doctorId } });
      if (emailExists) throw new NotFoundException(PatientErrorMessages.emailExists);
    }
    if (patient) mreCount = patient.id.toString();
    const mreNumber = `MRE-${(mreCount + 1).padStart(7, '0')}`;
    patient = this.patientRepository.create({
      mreNumber,
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      occupation,
      doctorId,
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
          isInsured: insuranceDetails.isInsured !== undefined ? insuranceDetails.isInsured : null,
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

  async getPatients(getPatientDto: GetPatientsDto, doctorId: number = undefined): Promise<ApiMessageDataPagination> {
    const { query, page = 1, limit = 10, gender, maritalStatus, nationality, sort = 'DESC' } = getPatientDto;

    const qb = this.patientRepository.createQueryBuilder('patient');

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

    if (doctorId !== undefined) qb.andWhere('patient.doctorId = :doctorId', { doctorId });
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

  async getPatient(patientId: number, doctorId: number = undefined): Promise<ApiMessageData> {
    const where = doctorId !== undefined ? { id: patientId, doctorId } : { id: patientId };
    const patient = await this.patientRepository.findOne({ where });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    if (patient.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (image) patient.profileImage = { id: image.id, fileName: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }

  async deletePatient(patientId: number, doctorId: number = undefined): Promise<ApiMessageData> {
    const where = doctorId !== undefined ? { id: patientId, doctorId } : { id: patientId };
    const patient = await this.patientRepository.findOne({ where });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    if (patient.profileImage) {
      const previousImageExists = this.fileStorageRepository.findOne({ where: { id: patient.profileImage as number } });
      if (previousImageExists) await this.fileStorageService.deleteFileStorage(patient.profileImage as number);
    }
    await this.patientRepository.delete({ id: patientId });
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }
}
