import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Appointment, BaseEntity, DiagnosisCodes, DoctorNotes, Note, Patient, SessionCosting, Transcript, User } from 'src/entity';
import { GenderEnum, SessionStatusEnum } from '@types';

@Entity({ name: 'sessions' })
export class Session extends BaseEntity {
  @Column({ type: 'varchar' })
  patientName: string;

  @Column({ type: 'varchar', nullable: true })
  sex?: GenderEnum;

  @Column({ type: 'varchar', nullable: true })
  sessionType?: string;

  @Column({ type: 'varchar', nullable: true })
  noteFormat?: string;

  @Column({ type: 'varchar', nullable: true })
  language?: string;

  @Column({ type: 'decimal', nullable: true, default: null })
  duration?: number;

  @Column({ type: 'varchar', default: SessionStatusEnum.PROCESS })
  status: SessionStatusEnum;

  @Column({ type: 'varchar', nullable: true, default: null })
  audioFile?: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  summary: Record<string, string>;

  @OneToOne(() => Transcript, (transcript) => transcript.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  transcript: Transcript;

  @OneToOne(() => Note, (note) => note.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  note: Note;

  @OneToOne(() => DoctorNotes, (doctorNotes) => doctorNotes.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  doctorNotes: DoctorNotes;

  @OneToOne(() => DiagnosisCodes, (diagnosisCodes) => diagnosisCodes.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  diagnosisCodes: DiagnosisCodes;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'integer', default: null })
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.sessions, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @OneToOne(() => SessionCosting, (sessionCost) => sessionCost.session, { nullable: true, cascade: true })
  @JoinColumn()
  sessionCosting: SessionCosting;

  @Column({ nullable: true })
  appointmentId: number;

  @OneToOne(() => Appointment, (appointment) => appointment.session, { nullable: true, cascade: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
