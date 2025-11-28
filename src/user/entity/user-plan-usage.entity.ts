import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PlanFeatureProperty, UserPlan } from '@entities';

@Entity('user_plan_usage')
export class UserPlanUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserPlan, (userPlan) => userPlan.usage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userPlanId' })
  userPlan: UserPlan;

  @Index()
  @Column({ type: 'integer' })
  userPlanId: number;

  @ManyToOne(() => PlanFeatureProperty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planFeaturePropertyId' })
  planFeatureProperty: PlanFeatureProperty;

  @Index()
  @Column({ type: 'integer' })
  planFeaturePropertyId: number;

  @Column({ type: 'integer', default: null, nullable: true })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

  export { UserPlanUsage as SubscriptionUsage };
