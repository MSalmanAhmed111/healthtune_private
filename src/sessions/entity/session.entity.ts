import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity, Note, Transcript } from 'src/entity';
import { GenderEnum, SessionStatusEnum } from '@types';

@Entity({ name: 'sessions' })
export class Session extends BaseEntity {
  @Column({ type: 'varchar' })
  patientName: string;

  @Column({ type: 'varchar', nullable: true })
  sex?: GenderEnum;

  @Column({ type: 'varchar', nullable: true })
  sessionType?: string;

  @Column({ type: 'varchar', nullable: true })
  noteFormat?: string;

  @Column({ type: 'varchar', nullable: true })
  language?: string;

  @Column({ type: 'varchar', default: SessionStatusEnum.PROCESS })
  status: SessionStatusEnum;

  @OneToOne(() => Transcript, (transcript) => transcript.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  transcript: Transcript;

  @OneToOne(() => Note, (note) => note.session, { nullable: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  note: Note;
}
