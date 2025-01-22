import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity, Session } from '@entities';

@Entity('transcripts')
export class Transcript extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @ManyToOne(() => Session, (session) => session.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'varchar', length: 255 })
  assemblyId: string;

  @Column({ type: 'jsonb' })
  content: object;
}
