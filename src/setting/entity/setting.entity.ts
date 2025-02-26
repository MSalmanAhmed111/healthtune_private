import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'setting' })
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'varchar', length: 100 })
  context: any;
}
