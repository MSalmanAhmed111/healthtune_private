import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plan, User, UserPlanUsage, Organization } from '@entities';

export enum SubscriberType {
  USER = 'user',
  ORGANIZATION = 'organization',
}

@Entity('user_plans')
@Index(['subscriberType', 'subscriberId'])
export class UserPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    default: SubscriberType.USER 
  })
  subscriberType: SubscriberType;

  @Index()
  @Column({ type: 'integer', nullable: true })
  subscriberId: number;

  @Column({ type: 'integer', nullable: true })
  userId: number;

  @Column({ type: 'varchar', nullable: true, unique: true })
  stripeCustomerId: string;

  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'boolean', default: false })
  cardAdded: boolean;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get isUserSubscription(): boolean {
    return this.subscriberType === SubscriberType.USER;
  }

  get isOrganizationSubscription(): boolean {
    return this.subscriberType === SubscriberType.ORGANIZATION;
  }

  async getSubscriber(
    userRepo: any,
    orgRepo: any
  ): Promise<User | Organization | null> {
    if (this.isUserSubscription) {
      return userRepo.findOne({ where: { id: this.subscriberId || this.userId } });
    } else {
      return orgRepo.findOne({ where: { id: this.subscriberId } });
    }
  }
}

// Export as Subscription alias for cleaner code
export { UserPlan as Subscription };
