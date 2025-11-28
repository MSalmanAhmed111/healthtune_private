import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { PaymentMethodEnum, SubscriptionStatusEnum } from '@types';
import { User, Plan } from '@entities';
import { Organization } from './organization.entity';
import { UserPlan, SubscriberType } from './user-plan.entity';

@Entity('subscription_history')
@Index(['subscriberType', 'subscriberId'])
export class SubscriptionHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ 
        type: 'varchar', 
        default: SubscriberType.USER 
    })
    subscriberType: SubscriberType;

    @Column({ type: 'integer' })
    subscriberId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ type: 'integer', nullable: true })
    userId?: number;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'organizationId' })
    organization?: Organization;

    @Column({ type: 'integer', nullable: true })
    organizationId?: number;

    @ManyToOne(() => Plan, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'planId' })
    plan: Plan;

    @Column({ type: 'integer', nullable: true })
    planId: number;

    @CreateDateColumn({ type: 'timestamp' })
    subscriptionDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'varchar', default: SubscriptionStatusEnum.SUBSCRIBED })
    status: SubscriptionStatusEnum;

    @Column({ type: 'varchar', default: PaymentMethodEnum.CREDIT_CARD })
    paymentMethod: PaymentMethodEnum;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amountPaid: number;

    @Column({ type: 'varchar', nullable: true, default: null })
    transactionId: string;
}
