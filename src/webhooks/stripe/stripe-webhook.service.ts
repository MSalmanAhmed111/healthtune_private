import { User, Plan, UserPlan, UserPlanUsage, PlanFeature } from '@entities';
import { StripeHelper } from '@helpers/stripe.helper';
import { PlanErrorMessages } from '@messages';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanTypeEnum, SeedPlanNamesEnum } from '@types';
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
    @InjectRepository(PlanFeature)
    private readonly PlanFeatureRepository: Repository<PlanFeature>,
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
            const userCards = await this.stripeHelper.retrieveCards(user.stripeCustomerId);
            if (userCards.length) await this.stripeHelper.deleteCard(userCards[0].id);
          }

          user.cardAdded = true;
          await this.userRepository.save(user);
        } else if (completedSession.mode === 'subscription' && completedSession.payment_status === 'paid') {
          // Handle new subscription
          const { userId, planId } = completedSession.metadata;
          const user = await this.userRepository.findOne({ where: { id: userId } });
          user.stripeSubscriptiontId = completedSession.subscription
          await this.userRepository.save(user);
          const plan = await this.planRepository.findOne({
            where: { id: planId },
            relations: ['features'],
          });
          if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);
          await this.createNewUserPlan(user, plan);
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
            where: { user: { id: userId } },
            relations: ['user', 'usage', 'usage.planFeatureProperty'],
          });

          if (userPlan) await this.renewUserPlan(userPlan, plan);
        }
        break;
      }
      case 'invoice.paid': {
        const paidInvoice = event.data.object as any;
        const user = await this.userRepository.findOne({
          where: { stripeCustomerId: paidInvoice.customer },
          relations: ['userPlan'],
        });

        if (user?.userPlan) {
          const plan = await this.planRepository.findOne({
            where: { id: user.userPlan.planId },
            relations: ['features'],
          });

          if (plan) {
            // Ensure it's a renewal and not a first-time payment
            const isFirstPayment = paidInvoice.billing_reason === 'subscription_create';
            if (!isFirstPayment) {
              await this.renewUserPlan(user.userPlan, plan);
            }
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as any;
        const user = await this.userRepository.findOne({
          where: { stripeCustomerId: failedInvoice.customer },
        });

        if (user?.userPlanId) {
          await this.userPlanRepository.update(user.userPlanId, {
            isSubscriptionActive: false,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object as any;
        const user = await this.userRepository.findOne({
          where: { stripeCustomerId: deletedSubscription.customer },
        });

        // Get default plan (free tier)
        const defaultPlan = await this.planRepository.findOne({
          where: { name: SeedPlanNamesEnum.BASIC_PLAN },
        });

        if (!defaultPlan) throw new NotFoundException(PlanErrorMessages.planNotExists);
        await this.createNewUserPlan(user, defaultPlan);
        break;
      }
      default:
        {
          console.log(`Unhandled event type ${event.type}`);
        }

        return HttpStatus.OK;
    }
  }

  private calculateEndDate(planType: PlanTypeEnum): Date | null {
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

  private async renewUserPlan(userPlan: UserPlan, plan: Plan): Promise<UserPlan> {
    const endDate = this.calculateEndDate(plan.planType);
    userPlan.endDate = endDate;
    userPlan.isSubscriptionActive = true;
    userPlan.resetDate = endDate;

    await this.resetUsageCounts(userPlan);
    return this.userPlanRepository.save(userPlan);
  }

  private async createNewUserPlan(user: User, plan: Plan): Promise<UserPlan> {
    // Clean up existing plan
    const existingUserPlan = await this.userPlanRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['usage'],
    });

    if (existingUserPlan) {
      await this.userPlanUsageRepository.delete({ userPlanId: existingUserPlan.id });
      user.userPlan = null;
      user.userPlanId = null;
      user = await this.userRepository.save(user);
      await this.userPlanRepository.delete({ id: existingUserPlan.id });
    }

    // Create new plan
    const endDate = this.calculateEndDate(plan.planType);
    const userPlan = this.userPlanRepository.create({
      user,
      plan,
      startDate: new Date(),
      endDate,
      isSubscriptionActive: true,
      usage: [],
    });

    // Create usages for plan features
    for (const feature of plan.features) {
      if (feature?.properties?.isUnlimited === true) continue;

      const newUsage = this.userPlanUsageRepository.create({
        planFeatureProperty: feature,
        planFeaturePropertyId: feature.id,
        usageCount: feature.properties?.limit ?? null,
      });

      userPlan.usage.push(newUsage);
    }
    await this.userPlanRepository.save(userPlan);
    user.userPlanId = userPlan.id;
    const newuser = await this.userRepository.save(user);
    return userPlan;
  }
}
