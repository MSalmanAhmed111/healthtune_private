import { Patient, Session, UserPlan } from '@entities';
import { fileObject } from '@types';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  clerkUserId: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  profileImage?: number | fileObject;

  @Column({ default: false })
  banned: boolean;

  @Column({ default: true })
  passwordEnabled: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  primaryEmailAddressId?: string;

  @Column({ type: 'jsonb', nullable: true })
  publicMetadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  privateMetadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  unsafeMetadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Session, (session) => session.user, { cascade: true, onDelete: 'CASCADE' })
  sessions: Session[];

  @OneToOne(() => UserPlan, { nullable: true })
  @JoinColumn({ name: 'userPlanId' })
  userPlan: UserPlan;

  @Column({ type: 'integer', default: null, nullable: true })
  userPlanId: number;

  @OneToMany(() => Patient, (patient) => patient.doctor, { cascade: true, onDelete: 'CASCADE' })
  patients: Patient[];
}
