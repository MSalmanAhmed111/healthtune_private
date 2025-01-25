import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'macros' })
export class Macro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  content: string;
}
