import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { Plan, User, UserPlanUsage } from '@entities';

@Entity('user_plans')
export class UserPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.userPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'integer' })
  userId: number;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Index()
  @Column({ type: 'integer' })
  planId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSubscriptionDate: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  resetDate: Date;

  @Column({ type: 'boolean', default: true })
  isSubscriptionActive: boolean;

  @OneToMany(() => UserPlanUsage, (usage) => usage.userPlan, { cascade: true })
  usage: UserPlanUsage[];
}
