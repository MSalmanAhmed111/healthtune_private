import { BaseEntity, User } from '@entities';
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'quick_notes' })
export class QuickNotes extends BaseEntity{
  @Column({ type: 'varchar' })
  file: string;

  @Column({ type: 'text' })
  transcript: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.quickNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
