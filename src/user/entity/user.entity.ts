import { EDocument, EDocumentIssuance, Patient, QuickNotes, Role, Session, Setting, SubscriptionHistory, UserDevices, UserPlan } from '@entities';
import { fileObject, DefaultRoleEnum, RolePermissions } from '@types';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';

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

  // Organization and Role fields
  @ManyToOne(() => Organization, (organization) => organization.users, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'integer', nullable: true, default: null })
  organizationId?: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  clerkOrganizationId?: string;


  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @Column({ type: 'integer', nullable: true, default: null })
  roleId?: number;

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

  @Column({ type: 'boolean', default: false })
  cardAdded: boolean;

  @OneToMany(() => Patient, (patient) => patient.doctor, { cascade: true, onDelete: 'CASCADE' })
  patients: Patient[];

  @Column({ type: 'varchar', nullable: true, default: null })
  stripeCustomerId: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  stripeSubscriptiontId: string;

  @OneToMany(() => SubscriptionHistory, (subscriptionHistory) => subscriptionHistory.user, { cascade: true, onDelete: 'CASCADE' })
  subscriptionHistory: SubscriptionHistory[];

  @OneToMany(() => Setting, (setting) => setting.user, { onDelete: 'CASCADE' })
  settings: Setting[];
  issuances: any;

  @OneToMany(() => EDocumentIssuance, (edocumentIssueance) => edocumentIssueance.doctorId, { onDelete: 'CASCADE' })
  edocuments: EDocumentIssuance[];

  @OneToMany(() => UserDevices, (userDevices) => userDevices.user)
  userDevices: UserDevices[];

  @OneToMany(() => QuickNotes, (quickNotes) => quickNotes.user)
  quickNotes: QuickNotes[];
}
