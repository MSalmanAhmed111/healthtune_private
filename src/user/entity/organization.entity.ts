import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Patient } from '@entities';
import { UserPlan } from './user-plan.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  clerkOrganizationId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  slug?: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  publicMetadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  privateMetadata?: Record<string, any>;

  @Column({ type: 'varchar', default: 'doctor' })
  defaultRole: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToOne(() => UserPlan, { nullable: true })
  @JoinColumn({ name: 'userPlanId' })
  userPlan: UserPlan;

  @Column({ type: 'integer', nullable: true })
  userPlanId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Patient, (patient) => patient.organization)
  patients: Patient[];
}
