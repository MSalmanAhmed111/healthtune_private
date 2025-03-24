import { PlanFeatureProperty, UserPlan } from '@entities';
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

  @Column({ type: 'varchar', nullable: true, default: null })
  stripePriceId: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  stripeProductId: string;

  @OneToMany(() => PlanFeatureProperty, (featureProperty) => featureProperty.plan, { cascade: true })
  features: PlanFeatureProperty[];

  @OneToMany(() => UserPlan, (userPlan) => userPlan.plan, { nullable: true })
  userPlans: UserPlan[];
}
