import { PlanFeatureProperty } from '@entities';
import { BaseFeatureProperties, ModuleEnum } from '@types';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('plan_features')
export class PlanFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  module: ModuleEnum;

  @Column({ type: 'jsonb', nullable: true })
  defaultProperties: BaseFeatureProperties;

  @OneToMany(() => PlanFeatureProperty, (featureProperty) => featureProperty.feature)
  featureProperties: PlanFeatureProperty[];
}
