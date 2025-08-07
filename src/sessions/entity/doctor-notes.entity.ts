import { Session } from "@entities";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";

@Entity('doctor_notes')
export class DoctorNotes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @OneToOne(() => Session, session => session.note)
    @JoinColumn({ name: 'sessionId' })
    session: Session;

    @Column({ type: 'jsonb' })
    content: Record<string, string>;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}