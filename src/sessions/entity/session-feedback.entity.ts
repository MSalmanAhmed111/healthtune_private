import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity, Session, User } from 'src/entity';

@Entity({ name: 'session_feedback' })
export class SessionFeedback extends BaseEntity {
  @Column({ type: 'text' })
  feedback: string;

  @Column()
  sessionId: number;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
