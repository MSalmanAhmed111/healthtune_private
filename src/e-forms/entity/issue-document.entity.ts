import { BaseEntity, EDocument, Patient, User } from '@entities';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

export class FieldValueEntity {
    @Column({ type: 'varchar' })
    fieldId: string;

    @Column({ type: 'varchar' })
    fieldValue: string;
}

@Entity({ name: 'edocument_issuances' })
export class EDocumentIssuance extends BaseEntity {
    @Column({ type: 'integer' })
    documentId: number;

    @ManyToOne(() => EDocument, (document) => document.issuances)
    @JoinColumn({ name: 'documentId' })
    document: EDocument;

    @Column({ type: 'integer', nullable: true })
    patientId: number;

    @ManyToOne(() => Patient, (patient) => patient.edocuments, { nullable: true })
    @JoinColumn({ name: 'patientId' })
    patient?: Patient;

    @Column({ type: 'integer' })
    doctorId: number;

    @ManyToOne(() => User, (user) => user.edocuments)
    @JoinColumn({ name: 'doctorId' })
    doctor: User;

    @Column({ type: 'varchar', nullable: true, default: null })
    issuedToOrgCode?: string;

    @Column({ type: 'text', nullable: true, default: null })
    description: string;

    @Column({ type: 'jsonb' })
    fieldValues: FieldValueEntity[];

    @Column({ type: 'varchar', nullable: true, default: null })
    businessProductId?: string | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    tagId?: string | null;
}