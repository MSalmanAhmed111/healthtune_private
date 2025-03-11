import { Plan, PlanFeature } from '@entities';
import { FeatureLimitTypeEnum } from '@types';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';

@Entity('plan_feature_properties')
export class PlanFeatureProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plan, (plan) => plan.features, { onDelete: 'CASCADE' })
  plan: Plan;

  @ManyToOne(() => PlanFeature, { eager: true, onDelete: 'CASCADE' })
  feature: PlanFeature;

  @Column({ type: 'integer' })
  @JoinColumn({ name: 'featureId' })
  featureId: number;

  @Column({ type: 'jsonb' })
  properties: Record<string, any>;
}
