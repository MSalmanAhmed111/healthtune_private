import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, User, UserPlan, UserPlanUsage } from '@entities';
import { SuccessResponseMessages } from '@messages';
import { ApiMessageData, PlanTypeEnum, SeedPlanNamesEnum } from '@types';
import { StripeHelper } from '@helpers/stripe.helper';
//import { User as ClerkUser } from '@clerk/backend';

@Injectable()
export class ClerkWebhookService {
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

  async syncUser(reqBody): Promise<ApiMessageData> {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata, username, primary_email_address_id, private_metadata, unsafe_metadata } = reqBody;
    console.log('reqBody: ', reqBody);
    const email = email_addresses[0].email_address;
    let user = await this.userRepository.findOne({ where: [{ clerkUserId: id }, { email }] });

    if (user) {
      user.firstName = first_name ?? user.firstName;
      user.lastName = last_name ?? user.lastName;
      user.username = username ?? user.username;
      user.imageUrl = image_url ?? user.imageUrl;
      user.publicMetadata = public_metadata ?? user.publicMetadata;
      user.privateMetadata = private_metadata ?? user.privateMetadata;
      user.unsafeMetadata = unsafe_metadata ?? user.unsafeMetadata;

      if (!user.stripeCustomerId) {
        user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`);
        user = await this.userRepository.save(user);
      }
      return { message: SuccessResponseMessages.successGeneral, data: user };
    } else {
      user = this.userRepository.create({
        clerkUserId: id,
        email,
        username,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
        publicMetadata: public_metadata,
        privateMetadata: private_metadata,
        unsafeMetadata: unsafe_metadata,
        primaryEmailAddressId: primary_email_address_id,
      });
      user = await this.userRepository.save(user);
      if (!user.stripeCustomerId) (user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`)), (user = await this.userRepository.save(user));
    }
    const plan = await this.planRepository.findOne({ where: { name: SeedPlanNamesEnum.BASIC_PLAN }, relations: ['features'] });
    if (!plan) return { message: 'User Created, but Unable to create default plan for user as no basic plan found.', data: user };

    const endDate = plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
    const userPlan = this.userPlanRepository.create({
      user,
      plan,
      startDate: new Date(),
      endDate,
      isSubscriptionActive: true,
      usage: [],
    });

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
    return { message: SuccessResponseMessages.successGeneral, data: user };
  }
}
