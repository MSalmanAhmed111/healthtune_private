import { User, Plan, UserPlan, UserPlanUsage } from '@entities';
import { StripeHelper } from '@helpers/stripe.helper';
import { PlanErrorMessages } from '@messages';
import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanTypeEnum } from '@types';
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
    private stripeHelper: StripeHelper,
  ) {}

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
      // Onboarding case
      case 'checkout.session.completed':
        const completedSession = event.data.object as any;
        if (completedSession.mode === 'setup') {
          // Card setup
          const { userId } = completedSession.metadata;
          // Check if user has added card previously
          const user = await this.userRepository.findOne({ where: { id: userId } });
          if (user.cardAdded) {
            // If Card exists, delete previous card from stripe
            const userCards = await this.stripeHelper.retrieveCards(user.stripeCustomerId);
            if (userCards.length) await this.stripeHelper.deleteCard(userCards[1].id);
          }
          // Update user account settings
          user.cardAdded = true;
          await this.userRepository.save(user);
        } else if (completedSession.mode === 'subscription') {
          // Payment
          if (completedSession.payment_status === 'paid') {
            const { userId, planId } = completedSession.metadata;
            // Find user and update subscription
            const plan = await this.planRepository.findOne({ where: { id: planId }, relations: ['features'] });
                if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);
            
                let userPlan = await this.userPlanRepository.findOne({ where: { user: { id: userId } }, relations: ['usage'] });
            
                if (userPlan) {
                    await this.userPlanUsageRepository.delete({userPlanId: userPlan.id})
                    await this.userPlanRepository.delete({id: userPlan.id})
                    userPlan.plan = plan;
                  userPlan.startDate = new Date();
                  userPlan.isSubscriptionActive = true;
                } else {
                  const endDate = plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
                  userPlan = this.userPlanRepository.create({
                    user,
                    plan,
                    startDate: new Date(),
                    endDate,
                    isSubscriptionActive: true,
                    usage: [],
                  });
                }
            
                userPlan.usage = userPlan.usage || [];
            
                for (const feature of plan.features) {
                  if (feature?.properties?.isUnlimited === null) continue;
            
                  const newUsage = this.userPlanUsageRepository.create({
                    planFeatureProperty: feature,
                    planFeaturePropertyId: feature.id,
                    usageCount: feature.properties.limit || null,
                  });
            
                  userPlan.usage.push(newUsage);
                }
            
                await this.userPlanRepository.save(userPlan);
                user.userPlanId = userPlan.id;
                await this.userRepository.save(user);
        }
        break;

      // Delayed payment successful
      case 'checkout.session.async_payment_succeeded':
        const succeededSession = event.data.object as any;
        if (succeededSession.mode === 'subscription') {
          // Payment
          if (succeededSession.payment_status === 'paid') {
            const { userId, planId } = succeededSession.metadata;
            // Find user and update subscription
            await this.AccountSetting.updateOne(
              { user: userId },
              {
                $set: {
                  plan: planId,
                  subscriptionActive: true,
                },
              },
            );
          }
        }
        break;

      // When monthly billing charge is successful
      case 'invoice.paid':
        const succeededInvoice = event.data.object as any;
        const { customer, hosted_invoice_url } = succeededInvoice;
        // Find user and update subscription status
        const userSettings: any = await this.AccountSetting.findOne({ 'stripe.customerId': customer }).populate({
          path: 'user',
          select: 'firstName lastName email',
        });
        await this.AccountSetting.updateOne({ 'stripe.customerId': customer }, { $set: { subscriptionActive: true } });
        const link = {
          url: hosted_invoice_url,
          text: 'See Invoice ->',
        };
        // Send email to user
        if (userSettings) {
          this.mailHelper.sendEmail(userSettings.user.email, 'Invoice Paid', 'Invoice payment was successful, Please visit this URL for more information: ', '', link, ' ');
        }
        break;

      // When monthly billing charge is failed
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        // Find user and update subscription status
        await this.AccountSetting.updateOne({ 'stripe.customerId': failedInvoice.customer }, { $set: { subscriptionActive: false } });
        break;

      case 'customer.subscription.deleted':
        const customerSubscriptionDeleted = event.data.object as any;
        await this.AccountSetting.updateOne(
          { 'stripe.customerId': customerSubscriptionDeleted.customer },
          {
            $set: {
              subscriptionActive: false,
              plan: '',
            },
          },
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    return HttpStatus.OK;
  }
}
