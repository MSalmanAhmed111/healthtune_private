import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, CreateDateColumn } from 'typeorm';
import { Session } from 'src/entity';

@Entity('transcripts')
export class Transcript {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @OneToOne(() => Session, (session) => session.transcript)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'varchar', length: 255 })
  assemblyId: string;

  @Column({ type: 'jsonb' })
  content: object;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
