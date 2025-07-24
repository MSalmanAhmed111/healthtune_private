import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, Setting, User, UserPlan, UserPlanUsage, Organization } from '@entities';
import { SuccessResponseMessages } from '@messages';
import { ApiMessageData, PlanTypeEnum, SeedPlanNamesEnum, SettingNames, DefaultRoleEnum, OrganizationMetadata } from '@types';
import { StripeHelper } from '@helpers/stripe.helper';
import { RoleBasedAccessService } from '@common/services/role-based-access.service';
//import { User as ClerkUser } from '@clerk/backend';

@Injectable()
export class ClerkWebhookService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    private stripeHelper: StripeHelper,
    private roleBasedAccessService: RoleBasedAccessService,
  ) {}

  async syncUser(reqBody): Promise<ApiMessageData> {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata, username, primary_email_address_id, private_metadata, unsafe_metadata } = reqBody;
    const email = email_addresses[0].email_address;
    
    // Extract organization data from public_metadata
    const organizationData = this.extractOrganizationData(public_metadata);
    
    let user = await this.userRepository.findOne({ where: [{ clerkUserId: id }, { email }], relations: ['settings', 'organization'] });

    const settings = [
      {
        type: 'General',
        name: SettingNames.Language,
        value: 'English',
        context: 'app/web',
        isGlobal: false,
        userId: user?.id,
      },
      {
        type: 'General',
        name: SettingNames.EnablePatientRecords,
        value: true,
        context: 'app/web',
        isGlobal: false,
        userId: user?.id,
      },
      {
        type: 'General',
        name: SettingNames.EnableAudioRecording,
        value: true,
        context: 'app/web',
        isGlobal: false,
        userId: user?.id,
      },
      {
        type: 'General',
        name: SettingNames.EnablePatientByAppointments,
        value: true,
        context: 'app/web',
        isGlobal: false,
        userId: user?.id,
      },
    ];

    if (user) {
      user.firstName = first_name ?? user.firstName;
      user.lastName = last_name ?? user.lastName;
      user.username = username ?? user.username;
      user.imageUrl = image_url ?? user.imageUrl;
      user.publicMetadata = public_metadata ?? user.publicMetadata;
      user.privateMetadata = private_metadata ?? user.privateMetadata;
      user.unsafeMetadata = unsafe_metadata ?? user.unsafeMetadata;

      // Handle organization data from public metadata
      const orgData = this.extractOrganizationData(public_metadata);
      if (orgData) {
        // Find organization by clerk ID
        const organization = await this.organizationRepository.findOne({ 
          where: { clerkOrganizationId: orgData.organizationId } 
        });
        
        if (organization) {
          user.organizationId = organization.id;
          user.clerkOrganizationId = orgData.organizationId;
          // Update organization role
          user.organizationRole = orgData.role;
          user.rolePermissions = orgData.permissions;
        }
      } else {
        // Reset role to default if no organization data
        user.role = user.role || DefaultRoleEnum.DOCTOR;
      }

      // ===> to be removed later (using to sync existing user stripe customer ids)
      if (!user.stripeCustomerId) {
        user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`);
        user = await this.userRepository.save(user);
      }

      // ===> to be removed later (using to sync existing user settings)
      await this.settingRepository.save({ ...settings, ...user.settings });

      return { message: SuccessResponseMessages.successGeneral, data: user };
    } else {
      // Handle organization data for new users
      const orgData = this.extractOrganizationData(public_metadata);
      let organizationId = null;
      let clerkOrganizationId = null;
      let role = DefaultRoleEnum.DOCTOR;
      let organizationRole = null;
      let rolePermissions = null;

      if (orgData) {
        const organization = await this.organizationRepository.findOne({ 
          where: { clerkOrganizationId: orgData.organizationId } 
        });
        
        if (organization) {
          organizationId = organization.id;
          clerkOrganizationId = orgData.organizationId;
          organizationRole = orgData.role || DefaultRoleEnum.DOCTOR;
          rolePermissions = orgData.permissions;
        }
      }

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
        organizationId,
        clerkOrganizationId,
        role,
        organizationRole,
        rolePermissions,
      });
      user = await this.userRepository.save(user);
      user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`);
      await this.settingRepository.save(settings.map((setting) => ({ ...setting, userId: user.id })));
      user = await this.userRepository.save(user);
    }
    const plan = await this.planRepository.findOne({ where: { name: SeedPlanNamesEnum.BASIC_PLAN }, relations: ['features'] });
    if (!plan) return { message: 'User Created, but Unable to create default plan for user as no basic plan found.', data: user };

    const endDate = plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
    let userPlan = this.userPlanRepository.create({
      user,
      plan,
      startDate: new Date(),
      endDate,
      resetDate: endDate,
      isSubscriptionActive: true,
      usage: [],
    });

    for (const feature of plan.features) {
      if (feature?.properties?.isUnlimited === null) continue;

      const newUsage = this.userPlanUsageRepository.create({
        planFeatureProperty: feature,
        planFeaturePropertyId: feature.id,
        usageCount: feature.properties.limit || null,
      });

      userPlan.usage.push(newUsage);
    }
    userPlan = await this.userPlanRepository.save(userPlan);
    user.userPlanId = userPlan.id;
    await this.userRepository.save(user);
    return { message: SuccessResponseMessages.successGeneral, data: user };
  }

  /**
   * Extract organization data from Clerk public metadata
   */
  private extractOrganizationData(publicMetadata: any): OrganizationMetadata | null {
    if (!publicMetadata || !publicMetadata.organizationId) {
      return null;
    }

    return {
      organizationId: publicMetadata.organizationId,
      role: publicMetadata.role || DefaultRoleEnum.DOCTOR,
      permissions: publicMetadata.permissions || []
    };
  }

  /**
   * Handle organization creation/synchronization
   */
  async syncOrganization(reqBody): Promise<ApiMessageData> {
    const { id, name, slug, image_url, public_metadata, private_metadata } = reqBody;
    
    let organization = await this.organizationRepository.findOne({ 
      where: { clerkOrganizationId: id } 
    });

    if (organization) {
      organization.name = name ?? organization.name;
      organization.slug = slug ?? organization.slug;
      organization.imageUrl = image_url ?? organization.imageUrl;
      organization.publicMetadata = public_metadata ?? organization.publicMetadata;
      organization.privateMetadata = private_metadata ?? organization.privateMetadata;
    } else {
      organization = this.organizationRepository.create({
        clerkOrganizationId: id,
        name,
        slug,
        imageUrl: image_url,
        publicMetadata: public_metadata,
        privateMetadata: private_metadata,
      });
    }

    organization = await this.organizationRepository.save(organization);

    // Sync organization roles from metadata if available
    if (public_metadata) {
      await this.roleBasedAccessService.syncOrganizationRoles(id, public_metadata);
    }

    return { message: SuccessResponseMessages.successGeneral, data: organization };
  }

  /**
   * Handle organization membership events
   */
  async syncOrganizationMembership(reqBody): Promise<ApiMessageData> {
    const { object, type, data } = reqBody;
    
    if (type === 'organizationMembership.created' || type === 'organizationMembership.updated') {
      const { user_id, organization_id, role, public_metadata } = data;
      
      const user = await this.userRepository.findOne({ 
        where: { clerkUserId: user_id } 
      });
      
      if (user) {
        const organization = await this.organizationRepository.findOne({
          where: { clerkOrganizationId: organization_id }
        });
        
        if (organization) {
          user.organization = organization;
          user.organizationId = organization.id;
          user.clerkOrganizationId = organization_id;
          user.organizationRole = role || DefaultRoleEnum.DOCTOR;
          
          // Extract role permissions from membership metadata
          if (public_metadata?.permissions) {
            user.rolePermissions = public_metadata.permissions;
          } else {
            // Fallback to null for dynamic resolution
            user.rolePermissions = null;
          }
          
          await this.userRepository.save(user);
        }
      }
      
      return { message: SuccessResponseMessages.successGeneral, data: { user_id, organization_id, role } };
    }
    
    if (type === 'organizationMembership.deleted') {
      const { user_id } = data;
      
      const user = await this.userRepository.findOne({ 
        where: { clerkUserId: user_id } 
      });
      
      if (user) {
        user.organization = null;
        user.organizationId = null;
        user.clerkOrganizationId = null;
        user.role = DefaultRoleEnum.DOCTOR;
        user.organizationRole = null;
        user.rolePermissions = null;
        
        await this.userRepository.save(user);
      }
      
      return { message: SuccessResponseMessages.successGeneral, data: { user_id } };
    }
    
    return { message: 'Organization membership event processed', data: reqBody };
  }

  /**
   * Extract organization metadata from public_metadata
   */
  
}
