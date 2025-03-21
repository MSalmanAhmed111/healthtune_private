import { Entity, Column, OneToMany, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Address, BaseEntity, Session, User } from 'src/entity';
import { GenderEnum, BloodTypeEnum, MaritalStatusEnum, fileObject } from '@types';

export class PatientMedicalDetailsEntity {
  @Column({ type: 'varchar', nullable: true })
  bloodType?: BloodTypeEnum;

  @Column({ type: 'text', nullable: true })
  medicalHistory?: string;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  currentMedications?: string;

  @Column({ type: 'text', nullable: true })
  chronicDiseases?: string;

  @Column({ type: 'text', nullable: true })
  surgicalHistory?: string;

  @Column({ type: 'boolean', default: false })
  isSmoker: boolean;

  @Column({ type: 'boolean', default: false })
  isAlcoholic: boolean;
}

export class PatientContactDetailsEntity {
  @Column({ type: 'varchar', nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  emergencyContactName?: string;

  @Column({ type: 'varchar', nullable: true })
  emergencyContactRelationship: string;

  @Column({ type: 'varchar', nullable: true })
  emergencyContactPhone?: string;
}

export class PatientInsuranceDetailsEntity {
  @Column({ type: 'boolean', default: false })
  isInsured: boolean;

  @Column({ type: 'varchar', nullable: true })
  insuranceProvider?: string;

  @Column({ type: 'varchar', nullable: true })
  insurancePolicyNumber?: string;

  @Column({ type: 'date', nullable: true })
  insuranceExpiryDate?: Date;
}

export class PatientAdmissionDetailsEntity {
  @Column({ type: 'boolean', nullable: true })
  isDischarged: boolean;

  @Column({ type: 'text', nullable: true })
  admissionReason?: string;

  // @Column({ type: 'text', nullable: true })
  // assignedDoctor?: string;

  @Column({ type: 'varchar', nullable: true })
  roomNumber?: string;

  @Column({ type: 'date', nullable: true })
  admissionDate?: Date;

  @Column({ type: 'date', nullable: true })
  dischargeDate?: Date;
}

@Entity({ name: 'patients' })
export class Patient extends BaseEntity {
  @Unique(['doctorId', 'email'])
  
  @Column({ type: 'varchar', unique: true })
  mreNumber: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', nullable: true })
  gender?: GenderEnum;

  @Column({ type: 'varchar', nullable: true })
  maritalStatus?: MaritalStatusEnum;

  @Column({ type: 'varchar', nullable: true })
  nationality?: string;

  @Column({ type: 'varchar', nullable: true })
  occupation?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  profileImage?: number | fileObject;

  @Column(() => Address)
  address: Address;

  @Column(() => PatientContactDetailsEntity)
  contactDetails: PatientContactDetailsEntity;

  @Column(() => PatientMedicalDetailsEntity)
  medicalDetails: PatientMedicalDetailsEntity;

  @Column(() => PatientInsuranceDetailsEntity)
  insuranceDetails: PatientInsuranceDetailsEntity;

  @Column(() => PatientAdmissionDetailsEntity)
  admissionDetails: PatientAdmissionDetailsEntity;

  @OneToMany(() => Session, (session) => session.patient, { cascade: true })
  sessions: Session[];

  @ManyToOne(() => User, (user) => user.patients, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor?: User;

  @Column({ type: 'integer', nullable: true, default: null })
  doctorId?: number;

}
