import { EDocumentIssuance, BaseEntity } from '@entities';
import { Entity, Column, OneToMany } from 'typeorm';

export class FieldEntity {
  @Column({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  dataType: string;

  @Column({ type: 'integer' })
  pageNo: number;

  @Column({ type: 'integer' })
  x: number;

  @Column({ type: 'integer' })
  y: number;
}

// export class QrCodeLocationEntity {
//   @Column({ type: 'integer' })
//   pageNo: number;

//   @Column({ type: 'integer' })
//   x: number;

//   @Column({ type: 'integer' })
//   y: number;
// }

@Entity({ name: 'edocuments' })
export class EDocument extends BaseEntity {

  @Column({ type: 'varchar' })
  documentName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  type?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  images: string[];

  @Column({ type: 'jsonb' }) // Store fields as JSON array
  fields: FieldEntity[];

  @Column({ type: 'varchar', nullable: true, default: null })
  templateDocHash: string;

  // @Column(() => QrCodeLocationEntity)
  // qrCodeLocation: QrCodeLocationEntity;

  @Column({ type: 'varchar', nullable: true, default: null })
  status: string;

  @OneToMany(() => EDocumentIssuance, (edocumentIssueance) => edocumentIssueance.patientId)
  issuances: EDocumentIssuance[];
}