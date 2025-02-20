import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
}
