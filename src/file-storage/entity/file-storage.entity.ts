import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ModuleEnum } from '@types';

@Entity({ name: 'file_storage' })
export class FileStorage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, enum: ModuleEnum })
  type: ModuleEnum;

  @Column({ type: 'varchar', default: null, nullable: true })
  name: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  location: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
