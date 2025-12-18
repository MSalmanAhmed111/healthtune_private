import { Admin, Organization, Plan, UserPlan, UserPlanUsage, SubscriptionHistory, PlanFeature, PlanFeatureProperty, User } from '@entities';
import { SubscriberType } from 'src/user/entity/user-plan.entity';
import { adminErrorMessages, SuccessResponseMessages } from '@messages';
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageData, ApiMessageDataPagination, SubscriptionStatusEnum, PaymentMethodEnum, PlanTypeEnum } from '@types';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminLoginDto, CreatePlanDto, UpdatePlanDto, PaginationQueryDto, OrganizationQueryDto } from '@dtos';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
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
    @InjectRepository(PlanFeature)
    private readonly featureRepository: Repository<PlanFeature>,
    @InjectRepository(PlanFeatureProperty)
    private readonly featurePropertyRepository: Repository<PlanFeatureProperty>,
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
  async getAllOrganizations(queryParams: OrganizationQueryDto): Promise<ApiMessageDataPagination> {
    const { page = 1, limit = 10, country, state, city } = queryParams;

    let query = this.organizationRepository.createQueryBuilder('org')
      .leftJoinAndSelect('org.userPlan', 'userPlan')
      .leftJoinAndSelect('userPlan.plan', 'plan')
      .leftJoinAndSelect('userPlan.usage', 'usage');

    let hasFilter = false;

    if (country) {
      query = query.where('org.country = :country', { country });
      hasFilter = true;
    }

    if (state) {
      query = hasFilter
        ? query.andWhere('org.state = :state', { state })
        : query.where('org.state = :state', { state });
      hasFilter = true;
    }

    if (city) {
      query = hasFilter
        ? query.andWhere('org.city = :city', { city })
        : query.where('org.city = :city', { city });
    }

    // Add pagination
    query = query.orderBy('org.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const [organizations, total] = await query.getManyAndCount();

    const organizationsWithSubscriptions = organizations.map(org => ({
      id: org.id,
      name: org.name,
      clerkOrganizationId: org.clerkOrganizationId,
      slug: org.slug,
      country: org.country,
      state: org.state,
      city: org.city,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      subscription: org.userPlan
        ? {
            id: org.userPlan.id,
            planId: org.userPlan.planId,
            plan: org.userPlan.plan,
            isActive: org.userPlan.isSubscriptionActive,
            startDate: org.userPlan.startDate,
            endDate: org.userPlan.endDate,
            usageCount: org.userPlan.usage?.length || 0,
            createdAt: org.userPlan.createdAt
          }
        : null
    }));

    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: organizationsWithSubscriptions,
      page,
      lastPage,
      total
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
        slug: organization.slug,
        clerkOrganizationId: organization.clerkOrganizationId,
        country: organization.country,
        state: organization.state,
        city: organization.city,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        subscription: organization.userPlan ? {
          id: organization.userPlan.id,
          planId: organization.userPlan.planId,
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
          usage: usageDetails,
          createdAt: organization.userPlan.createdAt
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

  // Plan CRUD Operations
  async createPlan(reqBody: CreatePlanDto): Promise<ApiMessageData> {
    this.logger.log(`Creating new plan: ${reqBody.name}`);
    const { name, description, price, planType, features } = reqBody;

    // Check if plan already exists
    const existingPlan = await this.planRepository.findOne({ where: { name } });
    if (existingPlan) {
      throw new BadRequestException(`Plan with name "${name}" already exists`);
    }

    // Create plan
    let plan = this.planRepository.create({
      name,
      description,
      price,
      planType,
      features: []
    });
    plan = await this.planRepository.save(plan);
    this.logger.log(`Plan created with ID: ${plan.id}`);

    // Add features to plan
    if (features && features.length > 0) {
      for (const featureProp of features) {
        const feature = await this.featureRepository.findOne({
          where: { id: featureProp.featureId }
        });
        if (!feature) {
          throw new BadRequestException(`Feature with ID ${featureProp.featureId} not found`);
        }

        let planFeatureProperty = this.featurePropertyRepository.create({
          plan,
          feature,
          displayName: featureProp.displayName,
          description: featureProp.description,
          featureId: featureProp.featureId,
          properties: featureProp.properties
        });
        planFeatureProperty = await this.featurePropertyRepository.save(planFeatureProperty);
        plan.features.push(planFeatureProperty);
      }
      this.logger.log(`Added ${features.length} features to plan ${plan.id}`);
    }

    return {
      message: 'Plan created successfully',
      data: plan
    };
  }

  async getPlan(planId: number): Promise<ApiMessageData> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['features', 'features.feature']
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    return {
      message: SuccessResponseMessages.successGeneral,
      data: plan
    };
  }

  async getPlans(queryParams: PaginationQueryDto): Promise<any> {
    const { page = 1, limit = 10, sort = 'DESC' } = queryParams;

    const [plans, total] = await this.planRepository.findAndCount({
      relations: ['features', 'features.feature'],
      take: limit,
      skip: (page - 1) * limit,
      order: { id: sort }
    });

    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: plans,
      page,
      lastPage,
      total
    };
  }

  async updatePlan(planId: number, reqBody: UpdatePlanDto): Promise<ApiMessageData> {
    this.logger.log(`Updating plan: ${planId}`);
    const { name, description, price, planType, features } = reqBody;

    let plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['features', 'features.feature']
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if new name is unique (if changing name)
    if (name && name !== plan.name) {
      const existingPlan = await this.planRepository.findOne({
        where: { name, id: Not(planId) }
      });
      if (existingPlan) {
        throw new BadRequestException(`Plan with name "${name}" already exists`);
      }
      plan.name = name;
    }

    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = price;
    if (planType !== undefined) plan.planType = planType;

    plan = await this.planRepository.save(plan);
    this.logger.log(`Plan ${planId} basic info updated`);

    // Update features if provided
    if (features && features.length > 0) {
      // Remove old features
      await this.featurePropertyRepository.delete({ plan: { id: planId } });
      plan.features = [];

      // Add new features
      for (const featureProp of features) {
        const feature = await this.featureRepository.findOne({
          where: { id: featureProp.featureId }
        });
        if (!feature) {
          throw new BadRequestException(`Feature with ID ${featureProp.featureId} not found`);
        }

        let planFeatureProperty = this.featurePropertyRepository.create({
          plan,
          feature,
          displayName: featureProp.displayName,
          description: featureProp.description,
          featureId: featureProp.featureId,
          properties: featureProp.properties
        });
        planFeatureProperty = await this.featurePropertyRepository.save(planFeatureProperty);
        plan.features.push(planFeatureProperty);
      }
      this.logger.log(`Updated ${features.length} features for plan ${planId}`);
    }

    return {
      message: 'Plan updated successfully',
      data: plan
    };
  }

  async deletePlan(planId: number): Promise<ApiMessageData> {
    this.logger.log(`Deleting plan: ${planId}`);
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if plan is in use by any organization
    const activePlans = await this.userPlanRepository.count({
      where: {
        planId: planId,
        isSubscriptionActive: true
      }
    });

    if (activePlans > 0) {
      throw new BadRequestException(
        `Cannot delete plan "${plan.name}" as it is currently assigned to ${activePlans} active subscription(s). Please cancel these subscriptions first.`
      );
    }

    // Delete all feature properties for this plan
    await this.featurePropertyRepository.delete({ plan: { id: planId } });

    // Delete the plan
    await this.planRepository.delete(planId);
    this.logger.log(`Plan ${planId} deleted successfully`);

    return {
      message: 'Plan deleted successfully',
      data: { planId, name: plan.name }
    };
  }

  // Feature Management
  async getFeatures(): Promise<ApiMessageData> {
    this.logger.log('Getting all available features');
    const features = await this.featureRepository.find({
      order: { module: 'ASC', name: 'ASC' }
    });

    return {
      message: SuccessResponseMessages.successGeneral,
      data: features
    };
  }

  // Individual User Subscription Management Methods
  async getAllIndividuals(paginationParams: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    this.logger.log('Fetching all individual users with subscriptions');
    
    const { page = 1, limit = 10 } = paginationParams;

    const [individuals, total] = await this.userPlanRepository.findAndCount({
      where: {
        subscriberType: SubscriberType.USER
      },
      relations: ['plan', 'usage'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    // Get all user IDs from individuals
    const individualUserIds = individuals.map(ind => ind.subscriberId || ind.userId);
    
    if (individualUserIds.length > 0) {
      // Get full user details - exclude users who are part of organizations
      const nonOrgUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...userIds)', { userIds: individualUserIds })
        .andWhere('user.organizationId IS NULL')
        .getMany();

      const nonOrgUserMap = new Map(nonOrgUsers.map(u => [u.id, u]));
      
      // Filter individuals to only include those not in organizations
      const filteredIndividuals = individuals.filter(ind => {
        const userId = ind.subscriberId || ind.userId;
        return nonOrgUserMap.has(userId);
      });

      const individualsWithSubscriptions = filteredIndividuals.map(userPlan => {
        const userId = userPlan.subscriberId || userPlan.userId;
        const user = nonOrgUserMap.get(userId);
        
        return {
          user: {
            id: user?.id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            imageUrl: user?.imageUrl,
            banned: user?.banned,
            createdAt: user?.createdAt,
            updatedAt: user?.updatedAt
          },
          subscription: {
            id: userPlan.id,
            planId: userPlan.planId,
            plan: {
              id: userPlan.plan?.id,
              name: userPlan.plan?.name,
              description: userPlan.plan?.description,
              price: userPlan.plan?.price,
              planType: userPlan.plan?.planType
            },
            isActive: userPlan.isSubscriptionActive,
            startDate: userPlan.startDate,
            endDate: userPlan.endDate,
            usageCount: userPlan.usage?.length || 0,
            createdAt: userPlan.createdAt
          }
        };
      });

      const lastPage = Math.ceil(total / limit);

      return {
        message: SuccessResponseMessages.successGeneral,
        data: individualsWithSubscriptions,
        page,
        lastPage,
        total
      };
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: [],
      page,
      lastPage: 0,
      total: 0
    };
  }

  async getIndividualDetails(userId: number): Promise<ApiMessageData> {
    this.logger.log(`Fetching details for individual user: ${userId}`);
    
    const subscription = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: userId
      },
      relations: [
        'plan',
        'usage',
        'usage.planFeatureProperty',
        'usage.planFeatureProperty.feature'
      ]
    });

    if (!subscription) {
      throw new NotFoundException(`No subscription found for user ${userId}`);
    }

    // Get user details separately
    const userDetails = await this.userRepository.findOne({
      where: { id: userId }
    });

    // Format usage data with feature details and remaining counts
    const usageDetails = subscription.usage?.map(u => {
      const limit = u.planFeatureProperty?.properties?.limit ?? null;
      const usedCount = u.usageCount ?? 0;
      const remaining = limit !== null ? limit - usedCount : null;
      return {
        featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
        displayName: u.planFeatureProperty?.displayName || 'Unknown',
        usedCount: usedCount,
        left: remaining,
        total: limit,
        isUnlimited: u.planFeatureProperty?.properties?.isUnlimited ?? false,
        limitType: u.planFeatureProperty?.properties?.limitType ?? null,
      };
    }) || [];

    return {
      message: SuccessResponseMessages.successGeneral,
      data: {
        userId,
        user: userDetails ? {
          id: userDetails.id,
          email: userDetails.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          username: userDetails.username,
          imageUrl: userDetails.imageUrl,
          banned: userDetails.banned,
          createdAt: userDetails.createdAt,
          updatedAt: userDetails.updatedAt
        } : null,
        subscription: {
          id: subscription.id,
          plan: {
            id: subscription.plan?.id,
            name: subscription.plan?.name,
            description: subscription.plan?.description,
            price: subscription.plan?.price,
            planType: subscription.plan?.planType,
          },
          isActive: subscription.isSubscriptionActive,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          usageCount: subscription.usage?.length || 0,
          usage: usageDetails,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId
        }
      }
    };
  }

  async assignPlanToIndividual(userId: number, planId: number): Promise<ApiMessageData> {
    this.logger.log(`Assigning plan ${planId} to individual user ${userId}`);
    
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
        subscriberType: SubscriberType.USER,
        subscriberId: userId 
      },
      relations: ['usage']
    });

    if (!subscription) {
      // Create new subscription for individual
      subscription = this.userPlanRepository.create({
        subscriberType: SubscriberType.USER,
        subscriberId: userId,
        userId: userId,
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

    // Record in subscription history
    await this.subscriptionHistoryRepository.save({
      subscriberType: SubscriberType.USER,
      subscriberId: userId,
      userId: userId,
      plan,
      planId,
      subscriptionDate: new Date(),
      endDate: this.calculateEndDate(plan.planType),
      isActive: true,
      status: SubscriptionStatusEnum.SUBSCRIBED,
      paymentMethod: PaymentMethodEnum.ADMIN_ASSIGNED,
      amountPaid: 0, // Admin assigned, no payment
      transactionId: `admin_assign_user_${Date.now()}`,
    });

    return {
      message: 'Plan assigned to individual user successfully',
      data: {
        userId,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
        },
        subscription: {
          id: savedSubscription.id,
          isActive: savedSubscription.isSubscriptionActive,
          startDate: savedSubscription.startDate,
          endDate: savedSubscription.endDate,
        }
      },
    };
  }

  async getIndividualSubscription(userId: number): Promise<ApiMessageData> {
    this.logger.log(`Fetching subscription for individual user: ${userId}`);
    
    const subscription = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: userId
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
        message: 'No subscription found for this user',
        data: null
      };
    }

    // Format usage with remaining counts
    const formattedUsage = subscription.usage?.map(u => {
      const limit = u.planFeatureProperty?.properties?.limit ?? null;
      const usedCount = u.usageCount ?? 0;
      const remaining = limit !== null ? limit - usedCount : null;
      return {
        id: u.id,
        planFeaturePropertyId: u.planFeaturePropertyId,
        featureName: u.planFeatureProperty?.feature?.name || 'Unknown',
        left: remaining,
        total: limit,
        usageCount: usedCount,
        updatedAt: u.updatedAt,
        createdAt: u.createdAt,
      };
    }) || [];

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

  async getIndividualSubscriptionHistory(userId: number): Promise<ApiMessageData> {
    this.logger.log(`Fetching subscription history for individual user: ${userId}`);
    
    const history = await this.subscriptionHistoryRepository.find({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: userId
      },
      relations: ['plan'],
      order: { subscriptionDate: 'DESC' }
    });

    return {
      message: SuccessResponseMessages.successGeneral,
      data: history
    };
  }

  async cancelIndividualSubscription(userId: number): Promise<ApiMessageData> {
    this.logger.log(`Cancelling subscription for individual user: ${userId}`);
    
    const subscription = await this.userPlanRepository.findOne({
      where: { 
        subscriberType: SubscriberType.USER,
        subscriberId: userId 
      },
      relations: ['plan']
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found for this user');
    }

    // Deactivate subscription
    subscription.isSubscriptionActive = false;
    await this.userPlanRepository.save(subscription);

    // Record cancellation in history
    await this.subscriptionHistoryRepository.save({
      subscriberType: SubscriberType.USER,
      subscriberId: userId,
      userId: userId,
      plan: subscription.plan,
      planId: subscription.planId,
      subscriptionDate: new Date(),
      endDate: subscription.endDate,
      isActive: false,
      status: SubscriptionStatusEnum.CANCELLED,
      paymentMethod: PaymentMethodEnum.ADMIN_ASSIGNED,
      amountPaid: 0,
      transactionId: `admin_cancel_user_${Date.now()}`,
    });

    return {
      message: 'Individual subscription cancelled successfully',
      data: {
        userId,
        subscriptionId: subscription.id,
        status: 'cancelled'
      },
    };
  }

  async updateIndividualUsage(userId: number, featureName: string, action: 'increment' | 'decrement' | 'reset'): Promise<ApiMessageData> {
    this.logger.log(`Updating usage for user ${userId}, feature: ${featureName}, action: ${action}`);
    
    const subscription = await this.userPlanRepository.findOne({
      where: {
        subscriberType: SubscriberType.USER,
        subscriberId: userId
      },
      relations: ['usage', 'usage.planFeatureProperty', 'usage.planFeatureProperty.feature']
    });

    if (!subscription) {
      throw new NotFoundException(`No subscription found for user ${userId}`);
    }

    const usage = subscription.usage?.find(u => u.planFeatureProperty?.feature?.name === featureName);
    if (!usage) {
      throw new NotFoundException(`Feature "${featureName}" not found in user's subscription`);
    }

    const limit = usage.planFeatureProperty?.properties?.limit ?? null;
    const previousCount = usage.usageCount ?? 0;
    let newCount = previousCount;

    switch (action) {
      case 'increment':
        if (limit !== null && previousCount >= limit) {
          throw new BadRequestException(`User has reached the limit of ${limit} for feature "${featureName}"`);
        }
        newCount = previousCount + 1;
        break;
      case 'decrement':
        newCount = Math.max(0, previousCount - 1);
        break;
      case 'reset':
        newCount = 0;
        break;
    }

    usage.usageCount = newCount;
    await this.userPlanUsageRepository.save(usage);

    const remaining = limit !== null ? limit - newCount : null;

    return {
      message: 'User usage updated successfully',
      data: {
        userId,
        featureName,
        previousCount,
        newCount,
        limit,
        remaining,
        action
      },
    };
  }
}
