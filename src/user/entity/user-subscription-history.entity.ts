import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn } from 'typeorm';
import { PaymentMethodEnum, SubscriptionStatusEnum } from '@types';
import { User, Plan } from '@entities';

@Entity('subscription_history')
export class SubscriptionHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'integer' })
    userId: number;

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
