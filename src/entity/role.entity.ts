import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { Permission } from './permissions.entity';
import { User } from '@entities';

@Entity('roles')
@Index(['organizationId', 'key'], { unique: true, where: 'organizationId IS NOT NULL' })
@Index(['key'], { unique: true, where: 'organizationId IS NULL' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  clerkRoleId: string;

  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  organizationId?: number;

  @ManyToOne('Organization', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization?: any;

  // Role-Permission many-to-many relationship
  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  // Users with this role
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @Column({ type: 'boolean', default: false })
  isSystemRole: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
