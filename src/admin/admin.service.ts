import { Admin, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory } from '@entities';
import { SubscriberType } from 'src/user/entity/user-plan.entity';
import { adminErrorMessages, SuccessResponseMessages } from '@messages';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageData, SubscriptionStatusEnum, PaymentMethodEnum, PlanTypeEnum } from '@types';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminLoginDto } from '@dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepository: Repository<SubscriptionHistory>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  
  async login(loginDto: AdminLoginDto): Promise<ApiMessageData> {
    const { email, password } = loginDto;

    if (!password) throw new BadRequestException('Password is required for local login');

    const admin = await this.adminRepository.createQueryBuilder('user').select(['user.id', 'user.firstName', 'user.lastName', 'user.password', 'user.email', 'user.isVerified', 'user.isActive']).where('user.email = :email', { email }).getOne();

    if (!admin) throw new BadRequestException(adminErrorMessages.invalidEmail);

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) throw new BadRequestException(adminErrorMessages.invalidPassword);

    const atSecret = this.configService.get<string>('jwt.accessTokenKey');
    const atExpiry = this.configService.get<string>('jwt.accessExpiry');
    const access_token = await this.jwtService.signAsync({ id: admin.id }, { secret: atSecret, expiresIn: atExpiry });

    const responseData = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      access_token,
    };

    return {
      message: SuccessResponseMessages.successGeneral,
      data: responseData,
    };
  }

  // Organization Subscription Management Methods
  async getAllOrganizations(): Promise<ApiMessageData> {
    const organizations = await this.organizationRepository.find({
      relations: ['userPlan', 'userPlan.plan', 'userPlan.usage'],
    });

    const organizationsWithSubscriptions = organizations.map(org => ({
      id: org.id,
      name: org.name,
      clerkOrganizationId: org.clerkOrganizationId,
      createdAt: org.createdAt,
      subscription: org.userPlan ? {
        id: org.userPlan.id,
        plan: org.userPlan.plan,
        isActive: org.userPlan.isSubscriptionActive,
        startDate: org.userPlan.startDate,
        endDate: org.userPlan.endDate,
        usageCount: org.userPlan.usage?.length || 0
      } : null
    }));

    return {
      message: SuccessResponseMessages.successGeneral,
      data: organizationsWithSubscriptions,
    };
  }

  async assignPlanToOrganization(organizationId: number, planId: number): Promise<ApiMessageData> {
    // Validate organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Validate plan exists
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['features']
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Find existing subscription or create new one
    let subscription = await this.userPlanRepository.findOne({
      where: { 
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organizationId 
      },
      relations: ['usage']
    });

    if (!subscription) {
      // Create new subscription for organization
      subscription = this.userPlanRepository.create({
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organizationId,
        userId: null, // Organizations don't have userId
        planId: plan.id,
        plan: plan,
        startDate: new Date(),
        endDate: this.calculateEndDate(plan.planType),
        resetDate: this.calculateEndDate(plan.planType),
        isSubscriptionActive: true,
      });
    } else {
      // Update existing subscription
      subscription.planId = plan.id;
      subscription.plan = plan;
      subscription.startDate = new Date();
      subscription.endDate = this.calculateEndDate(plan.planType);
      subscription.resetDate = this.calculateEndDate(plan.planType);
      subscription.isSubscriptionActive = true;

      // Remove old usage records
      if (subscription.usage?.length > 0) {
        await this.userPlanUsageRepository.remove(subscription.usage);
      }
    }

    // Create usage records BEFORE saving subscription
    subscription.usage = [];
    for (const feature of plan.features) {
      const usage = this.userPlanUsageRepository.create({
        planFeatureProperty: feature,
        planFeaturePropertyId: feature.id,
        usageCount: 0, // Start at 0 and increment as features are used
      });
      subscription.usage.push(usage);
    }

    // Save subscription with usage records in one operation
    const savedSubscription = await this.userPlanRepository.save(subscription);

    // Update organization reference
    organization.userPlanId = savedSubscription.id;
    await this.organizationRepository.save(organization);

    // Record in subscription history
    await this.subscriptionHistoryRepository.save({
      subscriberType: SubscriberType.ORGANIZATION,
      subscriberId: organizationId,
      organization,
      organizationId,
      plan,
      planId,
      subscriptionDate: new Date(),
      endDate: this.calculateEndDate(plan.planType),
      isActive: true,
      status: SubscriptionStatusEnum.SUBSCRIBED,
      paymentMethod: PaymentMethodEnum.ADMIN_ASSIGNED,
      amountPaid: 0, // Admin assigned, no payment
      transactionId: `admin_assign_${Date.now()}`,
    });

    return {
      message: 'Plan assigned to organization successfully',
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
        },
        subscription: {
          id: subscription.id,
          isActive: subscription.isSubscriptionActive,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        }
      },
    };
  }

  async getOrganizationSubscription(organizationId: number): Promise<ApiMessageData> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subscription = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organizationId
      },
      relations: [
        'plan',
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ]
    });

    if (!subscription) {
      return {
        message: 'No subscription found for this organization',
        data: null
      };
    }

    // Format usage with feature names
    const formattedUsage = subscription.usage?.map(u => ({
      id: u.id,
      planFeaturePropertyId: u.planFeaturePropertyId,
      featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
      usageCount: u.usageCount ?? 0,
      updatedAt: u.updatedAt,
      createdAt: u.createdAt,
      properties: u.planFeatureProperty?.properties || {}
    })) || [];

    return {
      message: SuccessResponseMessages.successGeneral,
      data: {
        id: subscription.id,
        planName: subscription.plan?.name,
        isSubscriptionActive: subscription.isSubscriptionActive,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        usage: formattedUsage,
        features: subscription.plan?.features || []
      }
    };
  }

  async getOrganizationSubscriptionHistory(organizationId: number): Promise<ApiMessageData> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const history = await this.subscriptionHistoryRepository.find({
      where: {
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organizationId
      },
      relations: ['plan'],
      order: { subscriptionDate: 'DESC' }
    });

    return {
      message: SuccessResponseMessages.successGeneral,
      data: history
    };
  }

  async getOrganizationDetails(organizationId: number): Promise<ApiMessageData> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: [
        'userPlan',
        'userPlan.plan',
        'userPlan.usage',
        'userPlan.usage.planFeatureProperty',
        'userPlan.usage.planFeatureProperty.feature'
      ]
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Format usage data with feature details
    const usageDetails = organization.userPlan?.usage?.map(u => ({
      featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
      displayName: u.planFeatureProperty?.displayName || 'Unknown',
      usageCount: u.usageCount ?? 0,
      isUnlimited: u.planFeatureProperty?.properties?.isUnlimited ?? false,
      limit: u.planFeatureProperty?.properties?.limit ?? null,
      limitType: u.planFeatureProperty?.properties?.limitType ?? null,
    })) || [];

    return {
      message: SuccessResponseMessages.successGeneral,
      data: {
        id: organization.id,
        name: organization.name,
        clerkOrganizationId: organization.clerkOrganizationId,
        createdAt: organization.createdAt,
        subscription: organization.userPlan ? {
          id: organization.userPlan.id,
          plan: {
            id: organization.userPlan.plan?.id,
            name: organization.userPlan.plan?.name,
            description: organization.userPlan.plan?.description,
            price: organization.userPlan.plan?.price,
            planType: organization.userPlan.plan?.planType,
          },
          isActive: organization.userPlan.isSubscriptionActive,
          startDate: organization.userPlan.startDate,
          endDate: organization.userPlan.endDate,
          usageCount: organization.userPlan.usage?.length || 0,
          usage: usageDetails
        } : null
      }
    };
  }

  async cancelOrganizationSubscription(organizationId: number): Promise<ApiMessageData> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subscription = await this.userPlanRepository.findOne({
      where: { 
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organizationId 
      },
      relations: ['plan']
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found for this organization');
    }

    // Deactivate subscription
    subscription.isSubscriptionActive = false;
    await this.userPlanRepository.save(subscription);

    // Record cancellation in history
    await this.subscriptionHistoryRepository.save({
      subscriberType: SubscriberType.ORGANIZATION,
      subscriberId: organizationId,
      organization,
      organizationId,
      plan: subscription.plan,
      planId: subscription.planId,
      subscriptionDate: new Date(),
      endDate: subscription.endDate,
      isActive: false,
      status: SubscriptionStatusEnum.CANCELLED,
      paymentMethod: PaymentMethodEnum.ADMIN_ASSIGNED,
      amountPaid: 0,
      transactionId: `admin_cancel_${Date.now()}`,
    });

    return {
      message: 'Organization subscription cancelled successfully',
      data: {
        organizationId,
        subscriptionId: subscription.id,
        status: 'cancelled'
      },
    };
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
}
