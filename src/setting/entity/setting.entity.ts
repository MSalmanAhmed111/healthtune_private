import { User } from '@entities';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'setting' })
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'varchar', length: 100 })
  context: any;

  @Column({ type: 'boolean', default: false })
  isGlobal: boolean;

  @Column({ type: 'integer', nullable: true, default: null })
  userId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
