import { Patient, User } from '@entities';
import { AppointmentStatus } from '@types';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => User, (user) => user.appointments, { eager: true })
  // doctor: User;

  // @ManyToOne(() => Patient, (patient) => patient.appointments, { eager: true })
  // patient: Patient;

  @Column({ type: 'integer' })
  patientId: number;

  @Column({ type: 'integer', nullable: true })
  doctorId: number;

  @Column({ type: 'timestamp', nullable: false })
  appointmentDate: Date;

  @Column({ type: 'varchar', length: 50, default: AppointmentStatus.Scheduled })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reasonForVisit: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  appointmentType: string; // e.g., Consultation, Follow-up, Physical Exam

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consultationFee: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string; // Clinic, Online, Home Visit

  @Column({ type: 'boolean', default: false })
  isTelemedicine: boolean; // Whether the appointment is virtual

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomNumber: string; // If it's an in-person visit

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
