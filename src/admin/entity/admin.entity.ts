import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', default: '' })
  verificationCode: string;

  @Column({ type: 'boolean', default: false })
  isPassCodeValid: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
