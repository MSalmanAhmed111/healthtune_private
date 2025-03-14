import { Plan, PlanFeature } from '@entities';
import { BaseFeatureProperties } from '@types';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';

@Entity('plan_feature_properties')
export class PlanFeatureProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plan, (plan) => plan.features, { onDelete: 'CASCADE' })
  plan: Plan;

  @Column({ type: 'varchar', nullable: true, default: null })
  displayName: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string;

  @ManyToOne(() => PlanFeature, { eager: true, onDelete: 'CASCADE'  })
  feature: PlanFeature;

  @Column({ type: 'integer' })
  @JoinColumn({ name: 'featureId' })
  featureId: number;

  @Column({ type: 'jsonb' })
  properties: BaseFeatureProperties;
}
