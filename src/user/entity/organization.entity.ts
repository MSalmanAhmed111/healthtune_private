import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { OrganizationRole } from '@types';
import { Patient } from '@entities';
import { Role } from '@entities';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Role, (role) => role.organization)
  roles: Role[];

  @OneToMany(() => Patient, (patient) => patient.organization)
  patients: Patient[];
}
