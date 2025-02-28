import { Session } from '@entities';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('diagnosis_codes')
export class DiagnosisCodes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @OneToOne(() => Session, (session) => session.note)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'jsonb' })
  content: object;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
