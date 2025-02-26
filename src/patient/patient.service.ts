import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreatePatientDto, GetPatientsDto, PaginationQueryDto, UpdatePatientDto } from 'src/dto';
import { PatientErrorMessages, SuccessResponseMessages } from '@messages';
import { Patient } from '@entities';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createPatient(reqBody: CreatePatientDto): Promise<ApiMessageData> {
    const { firstName, lastName, email, dateOfBirth, gender, maritalStatus, nationality, occupation, address, medicalDetails, contactDetails, admissionDetails, insuranceDetails } = reqBody;
    let mreCount = '0';
    let patient = await this.patientRepository.findOne({ where: {}, order: { id: 'DESC' } });
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
    await this.patientRepository.save(patient);
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }
  async updatePatient(patientId: number, reqBody: UpdatePatientDto): Promise<ApiMessageData> {
    const { firstName, lastName, dateOfBirth, gender, maritalStatus, nationality, occupation, address, contactDetails, medicalDetails, insuranceDetails, admissionDetails } = reqBody;

    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
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

    await this.patientRepository.save(patient);

    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }

  async getPatients(getPatientDto: GetPatientsDto): Promise<ApiMessageDataPagination> {
    const { query, page = 1, limit = 10, gender, maritalStatus, nationality } = getPatientDto;

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

    if (gender) qb.andWhere('LOWER(patient.gender) = LOWER(:gender)', { gender });
    if (maritalStatus) qb.andWhere('LOWER(patient.maritalStatus) = LOWER(:maritalStatus)', { maritalStatus });
    if (nationality) qb.andWhere('LOWER(patient.nationality) = LOWER(:nationality)', { nationality });

    qb.skip((page - 1) * limit).take(limit);

    const [patients, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: patients,
      page,
      total,
      lastPage,
    };
  }

  async getPatient(patientId: number): Promise<ApiMessageData> {
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }

  async deletePatient(patientId: number): Promise<ApiMessageData> {
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(PatientErrorMessages.patientNotExists);
    await this.patientRepository.delete({ id: patientId });
    return { message: SuccessResponseMessages.successGeneral, data: patient };
  }
}
