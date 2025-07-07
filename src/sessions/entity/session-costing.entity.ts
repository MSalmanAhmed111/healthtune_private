import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Session } from './session.entity';

@Entity({ name: 'session_costing' })
export class SessionCosting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  totalInputTokens: number;

  @Column({ type: 'integer' })
  totalOutputTokens: number;

  @Column({ type: 'integer' })
  totalTokens: number;

  @Column({ type: 'varchar' })
  totalInputCost: string;

  @Column({ type: 'varchar' })
  totalOutputCost: string;

  @Column({ type: 'varchar' })
  totalSessionCost: string;

  @Column({ type: 'text', array: true })
  operations: string[];

  @OneToOne(() => Session, (session) => session.sessionCosting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  sessionId: number;
}
