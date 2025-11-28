import { User, Plan, UserPlan, UserPlanUsage, SubscriptionHistory } from '@entities';
import { StripeHelper } from '@helpers/stripe.helper';
import { PlanErrorMessages } from '@messages';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodEnum, PlanTypeEnum, SubscriptionStatusEnum } from '@types';
import { SubscriberType } from 'src/user/entity/user-plan.entity';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class StripeWebhookService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepository: Repository<SubscriptionHistory>,
    private stripeHelper: StripeHelper,
  ) { }

  async checkOutWebhook(payload: any) {
    const payloadString = JSON.stringify(payload, null, 2);
    let event: Stripe.Event;
    try {
      event = await this.stripeHelper.stripeEvent(payloadString);
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return HttpStatus.BAD_REQUEST;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const completedSession = event.data.object as any;
        if (completedSession.mode === 'setup') {
          // Handle card setup
          const { userId } = completedSession.metadata;
          const user = await this.userRepository.findOne({ where: { id: userId } });

          if (user.cardAdded) {
            // Find user's subscription to get stripe customer ID
            const userSubscription = await this.userPlanRepository.findOne({
              where: { subscriberType: SubscriberType.USER, subscriberId: user.id }
            });
            const stripeCustomerId = userSubscription?.stripeCustomerId;
            if (stripeCustomerId) {
              const userCards = await this.stripeHelper.retrieveCards(stripeCustomerId);
            }

          }

          user.cardAdded = true;
          await this.userRepository.save(user);
        } else if (completedSession.mode === 'subscription' && completedSession.payment_status === 'paid') {
          // Handle new user subscription (unified schema)
          const { userId, planId } = completedSession.metadata;
          const user = await this.userRepository.findOne({ where: { id: userId } });
          if (!user) throw new NotFoundException('User not found');
          
          const plan = await this.planRepository.findOne({
            where: { id: planId },
            relations: ['features'],
          });
          if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);
          
          // Find or create user subscription
          let subscription = await this.userPlanRepository.findOne({
            where: { subscriberType: SubscriberType.USER, subscriberId: userId }
          });
          
          if (!subscription) {
            subscription = this.userPlanRepository.create({
              subscriberType: SubscriberType.USER,
              subscriberId: userId,
              userId: userId,
            });
          }
          
          subscription.stripeSubscriptionId = completedSession.subscription;
          await this.userPlanRepository.save(subscription);
          
          await this.createNewUserPlan(subscription, plan);
          await this.subscriptionHistoryRepository.save({
            subscriberType: SubscriberType.USER,
            subscriberId: userId,
            user,
            userId,
            plan,
            subscriptionDate: new Date(),
            endDate: this.calculateEndDate(plan.planType),
            isActive: true,
            status: SubscriptionStatusEnum.SUBSCRIBED,
            paymentMethod: PaymentMethodEnum.CREDIT_CARD,
            amountPaid: parseFloat(plan.price),
            transactionId: completedSession.id,
          });
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded': {
        const succeededSession = event.data.object as any;
        if (succeededSession.mode === 'subscription' && succeededSession.payment_status === 'paid') {
          const { userId, planId } = succeededSession.metadata;
          const plan = await this.planRepository.findOne({
            where: { id: planId },
            relations: ['features'],
          });

          if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);

          const userPlan = await this.userPlanRepository.findOne({
            where: { 
              subscriberType: SubscriberType.USER,
              subscriberId: userId 
            },
            relations: ['user', 'usage', 'usage.planFeatureProperty'],
          });

          if (userPlan) {
            await this.renewUserPlan(userPlan, plan);
            await this.subscriptionHistoryRepository.save({
              subscriberType: SubscriberType.USER,
              subscriberId: userId,
              userId,
              plan,
              subscriptionDate: new Date(),
              endDate: this.calculateEndDate(plan.planType),
              isActive: true,
              status: SubscriptionStatusEnum.RENEWED,
              paymentMethod: PaymentMethodEnum.CREDIT_CARD,
              amountPaid: parseFloat(plan.price),
              transactionId: succeededSession.id,
            });
          }
        }
        break;
      }
      case 'invoice.paid': {
        const paidInvoice = event.data.object as any;
        // Find subscription by stripeCustomerId - need to query subscription directly
        const subscription = await this.userPlanRepository.findOne({
          where: { 
            subscriberType: SubscriberType.USER,
            stripeCustomerId: paidInvoice.customer 
          },
          relations: ['user', 'plan'],
        });

        if (subscription) {
          const plan = subscription.plan;

          if (plan) {
            // Ensure it's a renewal and not a first-time payment
            const isFirstPayment = paidInvoice.billing_reason === 'subscription_create';
            if (!isFirstPayment) {
              await this.renewUserPlan(subscription, plan);
              await this.subscriptionHistoryRepository.save({
                subscriberType: SubscriberType.USER,
                subscriberId: subscription.subscriberId,

                userId: subscription.userId,
                plan,
                subscriptionDate: new Date(),
                endDate: this.calculateEndDate(plan.planType),
                isActive: true,
                status: SubscriptionStatusEnum.RENEWED,
                paymentMethod: PaymentMethodEnum.CREDIT_CARD,
                amountPaid: parseFloat(plan.price),
                transactionId: paidInvoice.id,
              });
            }
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as any;
        const subscription = await this.userPlanRepository.findOne({
          where: { 
            subscriberType: SubscriberType.USER,
            stripeCustomerId: failedInvoice.customer 
          },
          relations: ['user', 'plan'],
        });

        if (subscription) {
          // Fetch user for history record
          const user = await this.userRepository.findOne({ where: { id: subscription.userId } });
          
          await this.userPlanRepository.update(subscription.id, {
            isSubscriptionActive: false,
          });
          await this.subscriptionHistoryRepository.save({
            subscriberType: SubscriberType.USER,
            subscriberId: subscription.subscriberId,
            user: user,
            userId: subscription.userId,
            planId: subscription.plan.id,
            subscriptionDate: new Date(),
            endDate: this.calculateEndDate(subscription.plan.planType),
            isActive: false,
            status: SubscriptionStatusEnum.FAILED,
            paymentMethod: PaymentMethodEnum.CREDIT_CARD,
            amountPaid: parseFloat(subscription.plan.price),
            transactionId: failedInvoice.id,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object as any;
        // const user = await this.userRepository.findOne({
        //   where: { stripeCustomerId: deletedSubscription.customer },

        // });

        // // Get default plan (free tier)
        // const defaultPlan = await this.planRepository.findOne({
        //   where: { name: SeedPlanNamesEnum.BASIC_PLAN },
        //   relations: ['features']
        // });

        // if (!defaultPlan) throw new NotFoundException(PlanErrorMessages.planNotExists);
        // await this.createNewUserPlan(user, defaultPlan);
        const userPlan = await this.userPlanRepository.findOne({ 
          where: { 
            subscriberType: SubscriberType.USER,
            stripeCustomerId: deletedSubscription.customer 
          }, 
          relations: ['user', 'plan', 'usage'] 
        });

        if (userPlan) {
          userPlan.stripeSubscriptionId = null;
          userPlan.isSubscriptionActive = false;
          await this.userPlanRepository.save(userPlan);
          
          await this.subscriptionHistoryRepository.save({
            subscriberType: SubscriberType.USER,
            subscriberId: userPlan.subscriberId,

            userId: userPlan.userId,
            planId: userPlan.plan.id,
            subscriptionDate: new Date(),
            endDate: this.calculateEndDate(userPlan.plan.planType),
            isActive: false,
            status: SubscriptionStatusEnum.CANCELLED,
            paymentMethod: PaymentMethodEnum.CREDIT_CARD,
            amountPaid: parseFloat(userPlan.plan.price),
            transactionId: deletedSubscription.id,
          });
        }
        break;
      }
      default:
        {
          console.log(`Unhandled event type ${event.type}`);
        }

        return HttpStatus.OK;
    }
  }

  calculateEndDate(planType: PlanTypeEnum): Date | null {
    const currentDate = new Date();
    switch (planType) {
      case PlanTypeEnum.MONTHLY:
        return new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      case PlanTypeEnum.YEARLY:
        return new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      default:
        return null;
    }
  }

  private async resetUsageCounts(userPlan: UserPlan): Promise<void> {
    for (const usage of userPlan.usage) {
      if (!usage.planFeatureProperty) continue;
      usage.usageCount = usage.planFeatureProperty.properties.limit ?? null;
      await this.userPlanUsageRepository.save(usage);
    }
  }

  async renewUserPlan(userPlan: UserPlan, plan: Plan): Promise<UserPlan> {
    const endDate = this.calculateEndDate(plan.planType);
    userPlan.endDate = endDate;
    userPlan.isSubscriptionActive = true;
    userPlan.resetDate = endDate;

    await this.resetUsageCounts(userPlan);
    return this.userPlanRepository.save(userPlan);
  }

  async createNewUserPlan(subscription: UserPlan, plan: Plan): Promise<UserPlan> {
    // Update existing subscription with new plan
    subscription.plan = plan;
    subscription.planId = plan.id;
    subscription.startDate = new Date();
    subscription.endDate = this.calculateEndDate(plan.planType);
    subscription.isSubscriptionActive = true;

    // Clean up existing usage
    if (subscription.id) {
      await this.userPlanUsageRepository.delete({ userPlanId: subscription.id });
    }

    // Save updated subscription
    const savedSubscription = await this.userPlanRepository.save(subscription);

    // Create usages for plan features
    for (const feature of plan.features) {
      if (feature?.properties?.isUnlimited === true) continue;

      const newUsage = this.userPlanUsageRepository.create({
        planFeatureProperty: feature,
        userPlanId: savedSubscription.id,
        planFeaturePropertyId: feature.id,
        usageCount: feature.properties?.limit ?? null,
      });

      await this.userPlanUsageRepository.save(newUsage);
    }

    return savedSubscription;
  }
}
