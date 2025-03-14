import { PlanFeatureProperty } from '@entities';
import { PlanTypeEnum } from '@types';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string;

  @Column({ type: 'varchar' })
  price: string;

  @Column({ type: 'varchar' })
  planType: PlanTypeEnum;

  @OneToMany(() => PlanFeatureProperty, (featureProperty) => featureProperty.plan, { cascade: true })
  features: PlanFeatureProperty[];
}
