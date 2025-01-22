import { Session } from "@entities";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";

@Entity('notes')
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @ManyToOne(() => Session, session => session.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    session: Session;

    @Column({ type: 'jsonb' })
    content: object;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}