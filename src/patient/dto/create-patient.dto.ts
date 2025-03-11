import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDate, IsBoolean, IsEnum, IsEmail, ValidateNested, Min, IsInt } from 'class-validator';
import { Trim } from '@decorators';
import { GenderEnum, BloodTypeEnum, MaritalStatusEnum } from '@types';
import { AddressDto } from '@dtos';
import { Type } from 'class-transformer';

export class PatientMedicalInfo {
  @ApiPropertyOptional({ description: 'Blood Type', enum: BloodTypeEnum, example: BloodTypeEnum.OPOSITIVE })
  @IsOptional()
  @IsEnum(BloodTypeEnum)
  bloodType?: BloodTypeEnum;

  @ApiPropertyOptional({ description: 'Medical History', example: 'Diabetes, Hypertension' })
  @IsOptional()
  @IsString()
  @Trim()
  medicalHistory?: string;

  @ApiPropertyOptional({ description: 'Allergies', example: 'Peanuts, Penicillin' })
  @IsOptional()
  @IsString()
  @Trim()
  allergies?: string;

  @ApiPropertyOptional({ description: 'Current Medications', example: 'Metformin, Lisinopril' })
  @IsOptional()
  @IsString()
  @Trim()
  currentMedications?: string;

  @ApiPropertyOptional({ description: 'Chronic Diseases', example: 'Asthma, Heart Disease' })
  @IsOptional()
  @IsString()
  @Trim()
  chronicDiseases?: string;

  @ApiPropertyOptional({ description: 'Surgical History', example: 'Appendectomy in 2015' })
  @IsOptional()
  @IsString()
  @Trim()
  surgicalHistory?: string;

  @ApiPropertyOptional({ description: 'Is the patient a smoker?', example: false })
  @IsOptional()
  @IsBoolean()
  isSmoker?: boolean;

  @ApiPropertyOptional({ description: 'Does the patient consume alcohol?', example: false })
  @IsOptional()
  @IsBoolean()
  isAlcoholic?: boolean;
}

export class PatientContactInfo {
  @ApiPropertyOptional({ description: 'Phone Number', example: '+1 9876543210' })
  @IsOptional()
  @IsString()
  @Trim()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Name', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @Trim()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Relationship', example: 'Spouse' })
  @IsOptional()
  @IsString()
  @Trim()
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Phone Number', example: '+1 9876543211' })
  @IsOptional()
  @IsString()
  @Trim()
  emergencyContactPhone?: string;
}

export class PatientInsuranceDetails {
  @ApiPropertyOptional({ description: 'Insurance Provider', example: 'Blue Cross Blue Shield' })
  @IsOptional()
  @IsString()
  @Trim()
  insuranceProvider?: string;

  @ApiPropertyOptional({ description: 'Insurance Policy Number', example: 'INS-987654' })
  @IsOptional()
  @IsString()
  @Trim()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance Expiry Date', example: '2026-12-31', type: Date })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  insuranceExpiryDate?: Date;

  @ApiPropertyOptional({ description: 'Is the patient insured?', example: true })
  @IsOptional()
  @IsBoolean()
  isInsured?: boolean;
}

export class PatientAdmissionDetails {
  @ApiPropertyOptional({ description: 'Admission Date', example: '2024-02-01', type: Date })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  admissionDate?: Date;

  @ApiPropertyOptional({ description: 'Reason for Admission', example: 'Chest Pain' })
  @IsOptional()
  @IsString()
  @Trim()
  admissionReason?: string;

  // @ApiPropertyOptional({ description: 'Assigned Doctor', example: 'Dr. Smith' })
  // @IsOptional()
  // @IsString()
  // @Trim()
  // assignedDoctor?: string;

  @ApiPropertyOptional({ description: 'Room Number', example: '302B' })
  @IsOptional()
  @IsString()
  @Trim()
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Is the patient discharged?', example: false })
  @IsOptional()
  @IsBoolean()
  isDischarged?: boolean;

  @ApiPropertyOptional({ description: 'Discharge Date', example: '2024-02-10', type: Date })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  dischargeDate?: Date;
}

export class CreatePatientDto {
  // @ApiProperty({ description: 'Medical Record Entry (MRE) Number', example: 'MRE-123456' })
  // @IsString()
  // @Trim()
  // @IsNotEmpty()
  // mreNumber: string;

  @ApiProperty({ description: 'First Name of the patient', example: 'John' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name of the patient', example: 'Doe' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email Address', example: 'johndoe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Date of Birth', example: '1990-05-15', type: Date })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender of the patient', enum: GenderEnum, example: GenderEnum.MALE })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ description: 'Marital Status', enum: MaritalStatusEnum, example: MaritalStatusEnum.SINGLE })
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum;

  @ApiPropertyOptional({ description: 'Nationality', example: 'American' })
  @IsOptional()
  @IsString()
  @Trim()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Occupation', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @Trim()
  occupation?: string;

  @ApiPropertyOptional({ example: '12', description: 'ID of the uploaded profile image' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  profileImage: number;

  @ApiPropertyOptional({ description: 'Full Address', type: () => AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional({ description: 'Medical info', type: () => PatientMedicalInfo })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientMedicalInfo)
  medicalDetails: PatientMedicalInfo;

  @ApiPropertyOptional({ description: 'Contact details', type: () => PatientContactInfo })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientContactInfo)
  contactDetails: PatientContactInfo;

  @ApiPropertyOptional({ description: 'Admission details', type: () => PatientAdmissionDetails })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientAdmissionDetails)
  admissionDetails: PatientAdmissionDetails;

  @ApiPropertyOptional({ description: 'Insurance details', type: () => PatientInsuranceDetails })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInsuranceDetails)
  insuranceDetails: PatientInsuranceDetails;
}
