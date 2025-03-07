import { BaseEntity } from '@entities';
import { Entity, Column } from 'typeorm';

@Entity({ name: 'templates' })
export class Template extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  title: string;

  @Column({ type: 'varchar' })
  prompt: string;

  @Column({ type: 'varchar', default: 'en' })
  language: string;
}
