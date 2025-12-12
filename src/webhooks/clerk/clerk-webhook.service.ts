import { Repository, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, Setting, User, UserPlan, UserPlanUsage, Organization, Role, Permission } from '@entities';
import { SubscriberType } from 'src/user/entity/user-plan.entity';
import { SuccessResponseMessages } from '@messages';
import { ApiMessageData, PlanTypeEnum, SeedPlanNamesEnum, SettingNames, DefaultRoleEnum, OrganizationMetadata, RolePermissions } from '@types';
import { StripeHelper } from '@helpers/stripe.helper';
import { RoleBasedAccessService } from 'src/common/services/role-based-access.service';

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
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private stripeHelper: StripeHelper,
    private roleBasedAccessService: RoleBasedAccessService,
  ) {}

  /**
   * Main webhook event handler - routes to specific logic based on event type
   */
  async handleWebhookEvent(event: any): Promise<ApiMessageData> {
    const eventType = event.type;
    const eventData = event.data;

    console.log(`🎯 Processing Clerk webhook event: ${eventType}`);
    console.log(`📦 Event data:`, JSON.stringify(eventData, null, 2));

    try {
      switch (eventType) {
        // User Events
        case 'user.created':
          console.log(`👤 New user created: ${eventData.email_addresses?.[0]?.email_address}`);
          return await this.syncUser(eventData);

        case 'user.updated':
          console.log(`👤 User updated: ${eventData.email_addresses?.[0]?.email_address}`);
          return await this.syncUser(eventData);

        // Organization Events
        case 'organization.created':
          console.log(`🏢 New organization created: ${eventData.name} by ${eventData.created_by}`);
          return await this.handleOrganizationCreated(eventData);

        case 'organization.updated':
          console.log(`🏢 Organization updated: ${eventData.name}`);
          return await this.handleOrganizationUpdated(eventData);

        // Organization Membership Events
        case 'organizationMembership.created':
          console.log(`👥 User ${event.data.public_user_data.identifier} joined organization ${event.data.organization.name}`);
          return await this.syncOrganizationMembership(event);

        case 'organizationMembership.updated':
          console.log(`👥 Membership updated for user ${event.data.public_user_data.identifier} in organization ${event.data.organization.name}`);
          return await this.syncOrganizationMembership(event);

        case 'organizationMembership.deleted':
          console.log(`👥 User ${event.data.public_user_data.identifier} left organization ${event.data.organization.name}`);
          return await this.syncOrganizationMembership(event);

        // Organization Invitation Events
        case 'organizationInvitation.accepted':
          console.log(`📧 Organization invitation accepted by ${eventData.email_address} for organization ${eventData.organization_id}`);
          return await this.handleInvitationAccepted(eventData);

        case 'organizationInvitation.created':
          console.log(`📧 Organization invitation created for ${eventData.email_address}`);
          return await this.handleInvitationCreated(eventData);

        case 'organizationInvitation.revoked':
          console.log(`📧 Organization invitation revoked for ${eventData.email_address}`);
          return await this.handleInvitationRevoked(eventData);

        // Role Events
        case 'role.created':
        case 'role.updated':
        case 'role.deleted':
          console.log(`ℹ️ Role event ignored - roles managed in backend`);
          return { message: 'Role event ignored', data: {} };

        // Default case for unhandled events
        default:
          console.log(`❓ Unhandled webhook event type: ${eventType}`);
          return this.handleUnknownEvent(eventType, eventData);
      }
    } catch (error) {
      console.error(`❌ Error processing webhook event ${eventType}:`, error);
      return {
        message: `Error processing ${eventType} event`,
        data: { eventType, error: error.message, processed: false },
      };
    }
  }

  /**
   * Handle unknown or unsupported webhook events
   */
  private handleUnknownEvent(eventType: string, eventData: any): ApiMessageData {
    console.log(`📝 Logging unknown event for future implementation: ${eventType}`);

    // Log the event structure for future development
    console.log(`📊 Event structure:`, {
      type: eventType,
      dataKeys: Object.keys(eventData || {}),
      sampleData: eventData,
    });

    return {
      message: 'Webhook received but not processed',
      data: { eventType, processed: false, logged: true },
    };
  }

  /**
   * Sync user data from Clerk
   */
  async syncUser(reqBody): Promise<ApiMessageData> {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata, username, primary_email_address_id, private_metadata, unsafe_metadata } = reqBody;
    const email = email_addresses[0].email_address;

    // Extract organization data from public_metadata
    const organizationData = this.extractOrganizationData(public_metadata);

    let user = await this.userRepository.findOne({
      where: [
        { clerkUserId: id },
        { email },
        { email, clerkUserId: Like('pending_%') }, // Also check for pending users from invitations
      ],
      relations: ['settings', 'organization'],
    });

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
      // Check if this is a pending user from invitation acceptance
      const wasPendingUser = user.clerkUserId?.startsWith('pending_');

      if (wasPendingUser) {
        console.log(`🔄 Converting pending user to full user: ${user.email}`);
        // Remove the pending metadata flag
        if (user.publicMetadata?.pendingFullCreation) {
          delete user.publicMetadata.pendingFullCreation;
        }
      }

      user.clerkUserId = id; // Update with real Clerk user ID
      user.firstName = first_name ?? user.firstName;
      user.lastName = last_name ?? user.lastName;
      user.username = username ?? user.username;
      user.imageUrl = image_url ?? user.imageUrl;
      user.publicMetadata = public_metadata ?? user.publicMetadata;
      user.privateMetadata = private_metadata ?? user.privateMetadata;
      user.unsafeMetadata = unsafe_metadata ?? user.unsafeMetadata;
      user.primaryEmailAddressId = primary_email_address_id;
      
      user = await this.userRepository.save(user);

      let subscription = await this.userPlanRepository.findOne({ 
        where: { subscriberType: SubscriberType.USER, subscriberId: user.id } 
      });
      if (subscription && !subscription.stripeCustomerId) {
        subscription.stripeCustomerId = await this.stripeHelper.createCustomer(
          { id: user.id, clerkUserId: user.clerkUserId }, 
          user.email, 
          `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`
        );
        await this.userPlanRepository.save(subscription);
      }

      // ===> to be removed later (using to sync existing user settings)
      await this.settingRepository.save({ ...settings, ...user.settings });

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
      
      await this.settingRepository.save(settings.map((setting) => ({ ...setting, userId: user.id })));
      
      // Create default plan with Stripe customer
      const plan = await this.planRepository.findOne({ where: { name: SeedPlanNamesEnum.BASIC_PLAN }, relations: ['features'] });
      if (!plan) return { message: 'User Created, but Unable to create default plan for user as no basic plan found.', data: user };

      // Create Stripe customer (will be stored in subscription entity)
      const stripeCustomerId = await this.stripeHelper.createCustomer(
        { id: user.id, clerkUserId: user.clerkUserId }, 
        user.email, 
        `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`
      );

      const endDate = plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
      let userPlan = this.userPlanRepository.create({
        subscriberType: SubscriberType.USER,
        subscriberId: user.id,
        userId: user.id, // Legacy field for backward compatibility
        stripeCustomerId, // Store Stripe customer in subscription entity
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
          usageCount: 0,
        });

        userPlan.usage.push(newUsage);
      }
      userPlan = await this.userPlanRepository.save(userPlan);
      user.userPlanId = userPlan.id;
      await this.userRepository.save({
        id: user.id,
        userPlanId: userPlan.id,
      });
      return { message: SuccessResponseMessages.successGeneral, data: user };
    }
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
      permissions: publicMetadata.permissions || [],
    };
  }

  /**
   * Handle organization creation/synchronization
   */
  async syncOrganization(reqBody): Promise<ApiMessageData> {
    // This method is kept for backward compatibility
    // New events should use handleOrganizationCreated or handleOrganizationUpdated
    return await this.handleOrganizationUpdated(reqBody);
  }

  /**
   * Handle organization creation event specifically
   */
  private async handleOrganizationCreated(eventData: any): Promise<ApiMessageData> {
    const { id, name, slug, image_url, public_metadata, private_metadata, created_by, created_at, updated_at } = eventData;

    console.log(`🏢 Creating new organization: ${name} (${id})`);
    console.log(`👤 Created by user: ${created_by}`);

    const address = public_metadata?.address || {};
    const country = address.country || null;
    const state = address.state || null;
    const city = address.city || null;

    console.log(`📍 Organization location: ${city}, ${state}, ${country}`);

    // Check if organization already exists
    let organization = await this.organizationRepository.findOne({
      where: { clerkOrganizationId: id },
      relations: ['roles'],
    });

    if (organization) {
      console.log(`⚠️ Organization already exists, ensuring setup is complete`);
      
      try {
        await this.createDefaultOrganizationPlan(organization);
      } catch (planError) {
        console.warn(`⚠️ Could not ensure default plan: ${planError.message}`);
      }
      
      // Still need to create default roles if they don't exist yet
      if (!organization.roles || organization.roles.length === 0) {
        console.log(`📋 Organization has no roles yet, creating defaults...`);
        try {
          const defaultRolesCreated = await this.createDefaultOrganizationRoles(organization);
          console.log(`✅ Default roles created: ${defaultRolesCreated}`);
          
          if (created_by) {
            console.log(`👑 Setting creator as admin...`);
            try {
              await this.setOrganizationCreatorAsAdmin(created_by, organization);
              console.log(`✅ Admin role assigned successfully`);
            } catch (adminError) {
              console.error(`⚠️ Could not set creator as admin: ${adminError.message}`);
            }
          }

          return {
            message: 'Organization roles and plan created successfully',
            data: {
              organization,
              adminAssigned: !!created_by,
              defaultRolesCreated,
            },
          };
        } catch (setupError) {
          console.error(`❌ CRITICAL: Failed to setup roles for organization ${organization.id}:`, setupError.message);
          return {
            message: 'Failed to create default roles',
            data: {
              organization,
              error: setupError.message,
              processed: false,
            },
          };
        }
      } else {
        console.log(`✅ Organization already has ${organization.roles.length} roles`);
      }
      return await this.handleOrganizationUpdated(eventData);
    }

    // Create new organization
    organization = this.organizationRepository.create({
      clerkOrganizationId: id,
      name,
      slug,
      imageUrl: image_url,
      country,
      state,
      city,
      publicMetadata: public_metadata,
      privateMetadata: private_metadata,
      createdAt: created_at ? new Date(created_at) : new Date(),
    });

    organization = await this.organizationRepository.save(organization);
    console.log(`✅ Organization created with ID: ${organization.id}`);

    try {
      // Create default plan for organization
      await this.createDefaultOrganizationPlan(organization);
      console.log(`✅ Default plan assigned to organization`);

      const defaultRolesCreated = await this.createDefaultOrganizationRoles(organization);
      console.log(`✅ Default roles created: ${defaultRolesCreated}`);


      if (created_by) {
        console.log(`👑 Setting creator as admin...`);
        try {
          await this.setOrganizationCreatorAsAdmin(created_by, organization);
          console.log(`✅ Admin role assigned successfully`);
        } catch (adminError) {
          console.error(`⚠️ Could not set creator as admin: ${adminError.message}`);
        }
      }

      return {
        message: 'Organization created successfully with default roles created',
        data: {
          organization,
          adminAssigned: !!created_by,
          defaultRolesCreated,
        },
      };
    } catch (setupError) {
      console.error(`❌ CRITICAL: Failed to setup organization ${organization.id}:`, setupError.message);
      
      // Delete the organization since setup failed
      try {
        await this.organizationRepository.remove(organization);
        console.log(`🗑️ Deleted incomplete organization: ${organization.id}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete incomplete organization:`, deleteError.message);
      }

      return {
        message: 'Organization creation failed - could not setup default roles',
        data: {
          organization,
          error: setupError.message,
          processed: false,
        },
      };
    }
  }

  /**
   * Handle organization update event specifically
   */
  private async handleOrganizationUpdated(eventData: any): Promise<ApiMessageData> {
    const { id, name, slug, image_url, public_metadata, private_metadata, updated_at } = eventData;

    console.log(`🏢 Updating organization: ${name} (${id})`);

    const address = public_metadata?.address || {};
    const country = address.country || null;
    const state = address.state || null;
    const city = address.city || null;

    console.log(`📍 Organization location: ${city}, ${state}, ${country}`);

    let organization = await this.organizationRepository.findOne({
      where: { clerkOrganizationId: id },
      relations: ['roles'],
    });

    if (!organization) {
      console.log(`⚠️ Organization not found, creating instead`);
      return await this.handleOrganizationCreated(eventData);
    }

    // Update organization data
    organization.name = name ?? organization.name;
    organization.slug = slug ?? organization.slug;
    organization.imageUrl = image_url ?? organization.imageUrl;
    organization.country = country ?? organization.country;
    organization.state = state ?? organization.state;
    organization.city = city ?? organization.city;
    organization.publicMetadata = public_metadata ?? organization.publicMetadata;
    organization.privateMetadata = private_metadata ?? organization.privateMetadata;

    organization = await this.organizationRepository.save(organization);
    console.log(`✅ Organization updated`);

    try {
      await this.createDefaultOrganizationPlan(organization);
    } catch (planError) {
      console.warn(`⚠️ Could not ensure default plan during update: ${planError.message}`);
    }

    if (!organization.roles || organization.roles.length === 0) {
      console.log(`📋 Organization has no roles yet, creating defaults...`);
      try {
        const defaultRolesCreated = await this.createDefaultOrganizationRoles(organization);
        console.log(`✅ Default roles created: ${defaultRolesCreated}`);

        return {
          message: 'Organization updated and default roles created',
          data: {
            organization,
            defaultRolesCreated,
          },
        };
      } catch (setupError) {
        console.error(`⚠️ Could not create default roles during update:`, setupError.message);
        return {
          message: 'Organization updated but failed to create default roles',
          data: {
            organization,
            error: setupError.message,
          },
        };
      }
    }

    return {
      message: 'Organization updated successfully',
      data: organization,
    };
  }

  /**
   * Handle organization membership events
   */
  async syncOrganizationMembership(reqBody): Promise<ApiMessageData> {
    const { object, type, data } = reqBody;

    console.log(`👥 Processing membership event: ${type}`);
    console.log(`📋 Membership data:`, JSON.stringify(data, null, 2));

    if (type === 'organizationMembership.created' || type === 'organizationMembership.updated') {
      const { id: membershipId, organization, public_user_data, role, role_name, permissions, public_metadata, private_metadata } = data;

      const user_id = public_user_data.user_id;
      const organization_id = organization.id;
      const customRoleKey = public_metadata?.userRole;

      console.log(`👤 Processing user: ${public_user_data.identifier} (${user_id})`);
      console.log(`🏢 Organization: ${organization.name} (${organization_id})`);
      console.log(`🎭 Role: ${role_name} (${role})`);
      console.log(`🎯 Custom Role from metadata:`, customRoleKey);
      console.log(`🔐 Permissions:`, permissions);

      // Retry finding the user with timer to handle concurrent user creation
      const user = await this.findUserWithRetry(user_id, 5, 15000);

      if (user) {
        // Find or create organization if it doesn't exist
        let orgEntity = await this.organizationRepository.findOne({
          where: { clerkOrganizationId: organization_id },
        });

        if (!orgEntity) {
          console.log(`🏢 Organization not found, creating: ${organization.name}`);
          orgEntity = await this.createOrganizationFromMembership(organization);
        } else {
          // Organization exists, ensure location data is synced
          const address = organization.public_metadata?.address || {};
          const country = address.country || null;
          const state = address.state || null;
          const city = address.city || null;

          if (country || state || city) {
            console.log(`📍 Updating organization location: ${city}, ${state}, ${country}`);
            orgEntity.country = country ?? orgEntity.country;
            orgEntity.state = state ?? orgEntity.state;
            orgEntity.city = city ?? orgEntity.city;
            await this.organizationRepository.save(orgEntity);
            console.log(`✅ Organization location updated`);
          }
        }

        // Get the organization-specific role if provided, otherwise use default
        let roleId = null;
        if (customRoleKey) {
          roleId = await this.getDefaultRole(customRoleKey);
          console.log(`🔍 Looking for custom role: ${customRoleKey}, found roleId: ${roleId}`);
        }
        
        if (!roleId) {
          console.log(`⚠️ Custom role not found, using default role`);
          roleId = (await this.getDefaultRole(role.toLowerCase())) || (await this.getDefaultRole(DefaultRoleEnum.ADMIN));
        }

        // Update user with organization membership
        user.organization = orgEntity;
        user.organizationId = orgEntity.id;
        user.clerkOrganizationId = organization_id;
        user.roleId = roleId;
        console.log({ role_name, role, customRoleKey, roleId: user.roleId });
        await this.userRepository.save(user);

        console.log(`✅ User ${user.email} added to organization ${orgEntity.name} as ${user.role}`);

        return {
          message: 'Organization membership processed successfully',
          data: {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
            organization: {
              id: orgEntity.id,
              name: orgEntity.name,
              clerkId: orgEntity.clerkOrganizationId,
            },
            membershipDetails: {
              user_id,
              organization_id,
              role: role_name || role,
              permissions: permissions,
            },
          },
        };
      } else {
        console.warn(`⚠️ User not found with Clerk ID: ${user_id}`);
        // Optionally create user if they don't exist
        // await this.createUserFromMembership(public_user_data, organization);

        return {
          message: 'User not found for organization membership',
          data: {
            user_id,
            organization_id,
            role: role_name || role,
            error: 'User not found',
          },
        };
      }
    }

    if (type === 'organizationMembership.deleted') {
      const { public_user_data } = data;
      const user_id = public_user_data.user_id;

      console.log(`👤 Removing user from organization: ${public_user_data.identifier}`);

      const user = await this.userRepository.findOne({
        where: { clerkUserId: user_id },
      });

      if (user) {
        const orgName = user.organization?.name || 'Unknown';

        user.organization = null;
        user.organizationId = null;
        user.clerkOrganizationId = null;
        user.roleId = await this.getDefaultRole(`org:${DefaultRoleEnum.ADMIN}`);

        await this.userRepository.save(user);

        console.log(`✅ User ${user.email} removed from organization ${orgName}`);
      }

      return {
        message: 'Organization membership deleted successfully',
        data: { user_id },
      };
    }

    return { message: 'Organization membership event processed', data: reqBody };
  }

  /**
   * Handle organization invitation accepted event
   */
  private async handleInvitationAccepted(eventData: any): Promise<ApiMessageData> {
    const { id: invitationId, email_address, organization_id, role, role_name, status, public_metadata, private_metadata, created_at, updated_at } = eventData;

    console.log(`📧 Processing accepted invitation for: ${email_address}`);
    console.log(`🏢 Organization ID: ${organization_id}`);
    console.log(`🎭 Role: ${role_name} (${role})`);
    console.log(`🎯 Custom Role from metadata:`, public_metadata?.userRole);

    // Extract the custom role from public_metadata
    const customRoleKey = public_metadata?.userRole;

    // Check if user already exists
    let user = await this.userRepository.findOne({
      where: { email: email_address },
    });

    if (user) {
      console.log(`👤 User already exists: ${user.email}, updating organization membership`);

      // Find organization
      let organization = await this.organizationRepository.findOne({
        where: { clerkOrganizationId: organization_id },
      });

      if (!organization) {
        console.warn(`⚠️ Organization not found: ${organization_id}, will be created when organization event triggers`);
        return {
          message: 'User exists but organization not found, will be updated when organization syncs',
          data: { email_address, organization_id, role: role_name || role },
        };
      }

      // Get the organization-specific role if provided, otherwise use default
      let roleId = null;
      if (customRoleKey) {
        roleId = await this.getDefaultRole(customRoleKey);
        console.log(`🔍 Looking for custom role: ${customRoleKey}, found roleId: ${roleId}`);
      }
      
      if (!roleId) {
        console.log(`⚠️ Custom role not found, using default role`);
        roleId = (await this.getDefaultRole(role)) || (await this.getDefaultRole(DefaultRoleEnum.DOCTOR));
      }

      // Update user with organization info
      user.organizationId = organization.id;
      user.clerkOrganizationId = organization_id;
      user.roleId = roleId;

      await this.userRepository.save(user);

      console.log(`✅ Updated existing user ${user.email} with organization membership`);

      return {
        message: 'Existing user updated with organization membership',
        data: {
          user: {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
          },
          organization: {
            id: organization.id,
            name: organization.name,
          },
        },
      };
    }

    // Create a minimal user record for the invitation
    // The full user details will be filled when user.created event triggers

    // Find or wait for organization
    let organization = await this.organizationRepository.findOne({
      where: { clerkOrganizationId: organization_id },
    });

    // Get the organization-specific role if provided, otherwise use default
    let roleId = null;
    if (customRoleKey) {
      roleId = await this.getDefaultRole(customRoleKey);
      console.log(`🔍 Looking for custom role: ${customRoleKey}, found roleId: ${roleId}`);
    }
    
    if (!roleId) {
      console.log(`⚠️ Custom role not found, using default role`);
      roleId = (await this.getDefaultRole(role)) || (await this.getDefaultRole(DefaultRoleEnum.DOCTOR));
    }

    // Create basic user record (only if user doesn't exist from user.created webhook)
    try {
      const newUser = this.userRepository.create({
        email: email_address,
        clerkUserId: `pending_${invitationId}`,
        organizationId: organization?.id || null,
        clerkOrganizationId: organization_id,
        roleId,
      });

      const savedUser = await this.userRepository.save(newUser);

      console.log(`✅ Created pending user record for invitation: ${email_address}`);
      console.log(`🔄 User will be fully populated when user.created event triggers`);

      return {
        message: 'Pending user created for accepted invitation',
        data: {
          user: {
            id: savedUser.id,
            email: savedUser.email,
            role: savedUser.roleId,
            status: 'pending_full_creation',
          },
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
              }
            : {
                clerkId: organization_id,
                status: 'not_synced_yet',
              },
          invitation: {
            id: invitationId,
            role: role_name || role,
          },
        },
      };
    } catch (error) {
      // If duplicate user error (user.created webhook already created the user)
      if (error.code === '23505' && error.detail?.includes('email')) {
        console.log(`⚠️ User already exists from user.created webhook, skipping pending user creation`);
        console.log(`🔄 User will be updated by organizationMembership.created webhook`);
        
        return {
          message: 'User already created from user.created webhook, will be updated by membership event',
          data: {
            email_address,
            organization_id,
            customRole: customRoleKey,
            note: 'organizationMembership.created will handle the role assignment',
          },
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Handle organization invitation created event
   */
  private async handleInvitationCreated(eventData: any): Promise<ApiMessageData> {
    const { id, email_address, organization_id, role, role_name } = eventData;

    console.log(`📧 Organization invitation created for: ${email_address}`);
    console.log(`🏢 Organization: ${organization_id}, Role: ${role_name || role}`);

    // Just log the invitation creation, no action needed
    // The actual user creation happens when invitation is accepted

    return {
      message: 'Organization invitation created',
      data: { id, email_address, organization_id, role: role_name || role },
    };
  }

  /**
   * Handle organization invitation revoked event
   */
  private async handleInvitationRevoked(eventData: any): Promise<ApiMessageData> {
    const { id, email_address, organization_id } = eventData;

    console.log(`📧 Organization invitation revoked for: ${email_address}`);

    // Check if we have a pending user for this invitation
    const pendingUser = await this.userRepository.findOne({
      where: {
        email: email_address,
        clerkUserId: `pending_${id}`,
      },
    });

    if (pendingUser) {
      // Remove the pending user record
      await this.userRepository.remove(pendingUser);
      console.log(`🗑️ Removed pending user record for revoked invitation: ${email_address}`);
    }

    return {
      message: 'Organization invitation revoked',
      data: { id, email_address, organization_id, pendingUserRemoved: !!pendingUser },
    };
  }

  /**
   * Handle role deleted event
   */
  private async handleRoleDeleted(eventData: any): Promise<ApiMessageData> {
    const clerkRoleId = eventData.id;
    console.log(`🗑️ Deleting role: ${clerkRoleId}`);

    try {
      const role = await this.roleRepository.findOne({
        where: { clerkRoleId },
        relations: ['users'],
      });

      if (!role) {
        console.warn(`⚠️ Role not found for deletion: ${clerkRoleId}`);
        return {
          message: 'Role not found',
          data: { clerkRoleId, deleted: false },
        };
      }

      // Check if role has users assigned
      if (role.users && role.users.length > 0) {
        console.warn(`⚠️ Role has ${role.users.length} users assigned, setting to inactive instead of deleting`);
        role.isActive = false;
        await this.roleRepository.save(role);

        return {
          message: 'Role marked as deleted (has users assigned)',
          data: { clerkRoleId, deleted: false, markedInactive: true },
        };
      }

      await this.roleRepository.remove(role);

      console.log(`✅ Role deleted: ${clerkRoleId}`);

      return {
        message: 'Role deleted successfully',
        data: { clerkRoleId, deleted: true },
      };
    } catch (error) {
      console.error(`❌ Error deleting role ${clerkRoleId}:`, error);
      return {
        message: 'Error deleting role',
        data: { clerkRoleId, deleted: false, error: error.message },
      };
    }
  }

  /**
   * Find user with retry mechanism for concurrent user creation scenarios
   */
  private async findUserWithRetry(clerkUserId: string, maxRetries: number = 5, delayMs: number = 500): Promise<User | null> {
    let attempt = 0;

    console.log(`🔍 Searching for user ${clerkUserId} with retry mechanism (max ${maxRetries} attempts)`);

    while (attempt < maxRetries) {
      attempt++;

      try {
        const user = await this.userRepository.findOne({
          where: { clerkUserId },
        });

        if (user) {
          console.log(`✅ User found on attempt ${attempt}: ${user.email}`);
          return user;
        }

        if (attempt < maxRetries) {
          console.log(`⏳ User not found on attempt ${attempt}/${maxRetries}, retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          console.log(`❌ User not found after ${maxRetries} attempts`);
        }
      } catch (error) {
        console.error(`💥 Error on attempt ${attempt} while finding user:`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    return null;
  }

  /**
   * Clean up orphaned pending users (utility method)
   */
  async cleanupOrphanedPendingUsers(): Promise<void> {
    try {
      // Find pending users older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const orphanedUsers = await this.userRepository.createQueryBuilder('user').where('user.clerkUserId LIKE :pattern', { pattern: 'pending_%' }).andWhere('user.createdAt < :cutoff', { cutoff: oneDayAgo }).getMany();

      if (orphanedUsers.length > 0) {
        await this.userRepository.remove(orphanedUsers);
        console.log(`🧹 Cleaned up ${orphanedUsers.length} orphaned pending users`);
      }
    } catch (error) {
      console.error('Error cleaning up orphaned pending users:', error);
    }
  }
  private async createOrganizationFromMembership(organizationData: any): Promise<Organization> {
    // Extract location data from public_metadata
    const address = organizationData.public_metadata?.address || {};
    const country = address.country || null;
    const state = address.state || null;
    const city = address.city || null;

    console.log(`📍 Organization location (from membership): ${city}, ${state}, ${country}`);

    const organization = this.organizationRepository.create({
      clerkOrganizationId: organizationData.id,
      name: organizationData.name,
      slug: organizationData.slug,
      imageUrl: organizationData.image_url,
      country,
      state,
      city,
      publicMetadata: organizationData.public_metadata,
      privateMetadata: organizationData.private_metadata,
      createdAt: organizationData.created_at ? new Date(organizationData.created_at) : new Date(),
    });

    const savedOrg = await this.organizationRepository.save(organization);

    console.log(`✅ Organization created from membership: ${savedOrg.name}`);
    console.log(`✅ Location saved: ${savedOrg.city}, ${savedOrg.state}, ${savedOrg.country}`);
    return savedOrg;
  }

  /**
   * Map Clerk permissions to our role permissions system
   */
  private mapClerkPermissionsToRolePermissions(clerkPermissions: string[], role: string, roleName: string): RolePermissions {
    // Default permissions based on role
    let permissions: RolePermissions = {
      canAccessOrganizationData: false,
      canAccessTodayOnlyData: true,
    };

    // Check if role indicates admin access
    const isAdmin = role?.toLowerCase().includes('admin') || roleName?.toLowerCase().includes('admin') || role?.toLowerCase().includes('owner') || roleName?.toLowerCase().includes('owner');

    // Check if role indicates staff access
    const isStaff = role?.toLowerCase().includes('member') || roleName?.toLowerCase().includes('staff') || roleName?.toLowerCase().includes('member');

    if (isAdmin) {
      permissions = {
        canAccessOrganizationData: true,
        canAccessTodayOnlyData: false,
      };
    } else if (isStaff) {
      permissions = {
        canAccessOrganizationData: true,
        canAccessTodayOnlyData: false,
      };
    }

    // Check for specific permissions that indicate broader access
    if (clerkPermissions && clerkPermissions.length > 0) {
      const hasWritePermissions = clerkPermissions.some((perm) => perm.includes('write') || perm.includes('create') || perm.includes('update'));

      const hasOrgWidePermissions = clerkPermissions.some((perm) => perm.includes('org:') && !perm.includes('own'));

      if (hasWritePermissions && hasOrgWidePermissions) {
        permissions.canAccessOrganizationData = true;
        permissions.canAccessTodayOnlyData = false;
      }
    }

    console.log(`🔐 Mapped permissions for ${roleName || role}:`, permissions);
    return permissions;
  }

  /**
   * Create default plan for organization when it's created
   */
  private async createDefaultOrganizationPlan(organization: Organization): Promise<void> {
    try {
      console.log(`📋 Creating default plan for organization: ${organization.name}`);

      // Find basic plan template with all its features
      const basicPlan = await this.planRepository.findOne({
        where: { name: SeedPlanNamesEnum.BASIC_PLAN },
        relations: ['features', 'features.feature'],
      });

      if (!basicPlan) {
        console.warn(`⚠️ Basic plan not found in database. Run seeder first: npm run seed:dev`);
        return;
      }

      console.log(`📋 Basic plan found with ${basicPlan.features ? basicPlan.features.length : 0} features`);

      // Check if organization already has a plan
      const existingPlan = await this.userPlanRepository.findOne({
        where: {
          subscriberType: SubscriberType.ORGANIZATION,
          subscriberId: organization.id,
        },
      });

      if (existingPlan) {
        console.log(`📋 Organization already has a plan assigned`);
        return;
      }

      // Create organization plan with empty Stripe customer (to be set later)
      const organizationPlan = this.userPlanRepository.create({
        subscriberType: SubscriberType.ORGANIZATION,
        subscriberId: organization.id,
        plan: basicPlan,
        startDate: new Date(),
        endDate: basicPlan.planType === PlanTypeEnum.MONTHLY
          ? new Date(new Date().setMonth(new Date().getMonth() + 1))
          : basicPlan.planType === PlanTypeEnum.YEARLY
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          : null,
        resetDate: basicPlan.planType === PlanTypeEnum.MONTHLY
          ? new Date(new Date().setMonth(new Date().getMonth() + 1))
          : basicPlan.planType === PlanTypeEnum.YEARLY
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          : null,
        isSubscriptionActive: true,
        usage: [],
      });

      // Initialize usage tracking for all plan features
      if (basicPlan.features && basicPlan.features.length > 0) {
        for (const feature of basicPlan.features) {
          if (feature?.properties?.isUnlimited === null) continue;

          const newUsage = this.userPlanUsageRepository.create({
            planFeatureProperty: feature,
            planFeaturePropertyId: feature.id,
            usageCount: 0,
          });

          organizationPlan.usage.push(newUsage);
        }
      }

      await this.userPlanRepository.save(organizationPlan);
      console.log(`✅ Default organization plan created with ${basicPlan.features?.length || 0} features`);
      
      // Link the plan to the organization
      organization.userPlanId = organizationPlan.id;
      await this.organizationRepository.save(organization);
      console.log(`🔗 Organization linked to plan`);
    } catch (error) {
      console.error(`❌ Error creating default organization plan:`, error.message);
      console.error(`Stack:`, error.stack);
      throw error;
    }
  }

  private async createDefaultOrganizationRoles(organization: Organization): Promise<boolean> {
    try {
      console.log(`🎭 Creating default roles for organization: ${organization.name}`);

      const systemRoles = await this.roleRepository.find({
        where: { organizationId: null, isSystemRole: true },
        relations: ['permissions'],
      });

      if (systemRoles.length === 0) {
        console.error('❌ CRITICAL: No system role templates found. Run roles seeder first.');
        console.error('   Execute: npm run seed:dev');
        throw new Error('System role templates not found. Run roles seeder.');
      }

      console.log(`📋 Found ${systemRoles.length} system role templates`);

      let rolesCreated = 0;
      const failedRoles = [];

      for (const systemRole of systemRoles) {
        try {
          console.log(`\n📝 Processing system role: ${systemRole.name} (${systemRole.key})`);
          console.log(`   - Permissions in template: ${systemRole.permissions?.length || 0}`);

          // Generate organization-specific role key
          const orgRoleKey = `org_${organization.id}_${systemRole.key.replace('org:', '')}`;

          // Check if this role already exists for this organization
          const existingRole = await this.roleRepository.findOne({
            where: { organizationId: organization.id, key: orgRoleKey },
          });

          if (existingRole) {
            console.log(`📋 Organization role already exists: ${systemRole.name}`);
            
            // Verify it has permissions
            if (!existingRole.permissions || existingRole.permissions.length === 0) {
              console.warn(`   ⚠️ WARNING: Existing role has NO permissions! Updating...`);
              existingRole.permissions = systemRole.permissions;
              await this.roleRepository.save(existingRole);
              console.log(`   ✅ Updated permissions (${systemRole.permissions?.length || 0})`);
            }
            
            rolesCreated++;
            continue;
          }

          // Validate that system role has permissions
          if (!systemRole.permissions || systemRole.permissions.length === 0) {
            console.error(`❌ ERROR: System role ${systemRole.name} has NO permissions!`);
            console.error(`   This means the seeder was run AFTER creating organizations.`);
            console.error(`   Or system roles were not properly created.`);
            throw new Error(`System role ${systemRole.name} missing permissions`);
          }

          // Create organization-specific role with permissions
          const orgRole = this.roleRepository.create({
            key: orgRoleKey,
            name: systemRole.name,
            description: `${systemRole.description} (${organization.name})`,
            organizationId: organization.id,
            isSystemRole: false,
            permissions: systemRole.permissions, // Copy permissions from system template
          });

          const savedRole = await this.roleRepository.save(orgRole);
          
          console.log(`✅ Created organization role: ${systemRole.name}`);
          console.log(`   - Permissions assigned: ${savedRole.permissions?.length || 0}`);
          
          rolesCreated++;
        } catch (roleError) {
          console.error(`❌ Error creating role ${systemRole.name}:`, roleError.message);
          failedRoles.push(systemRole.name);
        }
      }

      if (failedRoles.length > 0) {
        console.error(`⚠️ Failed to create ${failedRoles.length} roles: ${failedRoles.join(', ')}`);
        throw new Error(`Failed to create roles: ${failedRoles.join(', ')}`);
      }

      console.log(`🎉 Created ${rolesCreated} default roles for organization: ${organization.name}`);
      return rolesCreated > 0;
    } catch (error) {
      console.error('❌ Error creating default organization roles:', error.message);
      throw error;
    }
  }

  /**
   * Set the organization creator as admin
   */
  private async setOrganizationCreatorAsAdmin(creatorClerkUserId: string, organization: Organization): Promise<void> {
    try {
      // Find the user who created the organization - with retry since user.created webhook may not have completed
      console.log(`👑 Finding organization creator: ${creatorClerkUserId}`);
      const creatorUser = await this.findUserWithRetry(creatorClerkUserId, 5, 1000);

      if (!creatorUser) {
        console.warn(`⚠️ Creator user not found with Clerk ID: ${creatorClerkUserId} (will be assigned via membership webhook)`);
        return;
      }

      // Find the organization admin role
      const adminRole = await this.roleRepository.findOne({
        where: { 
          organizationId: organization.id, 
          key: `org_${organization.id}_admin` 
        },
      });

      if (!adminRole) {
        console.error(`❌ CRITICAL: Admin role not found for organization ${organization.id}`);
        throw new Error(`Admin role missing for organization ${organization.id}`);
      }

      // Set the creator as admin of the organization
      creatorUser.organization = organization;
      creatorUser.organizationId = organization.id;
      creatorUser.clerkOrganizationId = organization.clerkOrganizationId;
      creatorUser.roleId = adminRole.id;

      await this.userRepository.save(creatorUser);

      console.log(`👑 Set user ${creatorUser.email} as admin of organization ${organization.name}`);
    } catch (error) {
      console.error('❌ Error setting organization creator as admin:', error.message);
      throw error;
    }
  }

  async getDefaultRole(key: string): Promise<number> {
    try {
      const defaultRole = await this.roleRepository.findOne({
        where: { key },
      });

      if (!defaultRole) {
        console.warn(`Default role ${DefaultRoleEnum.DOCTOR} not found`);
        return null;
      }

      return defaultRole.id;
    } catch (error) {
      console.error('Error fetching default role:', error);
      return null;
    }
  }

  async syncRole(roleData: any, organizationId?: string): Promise<ApiMessageData> {
    const { id: clerkRoleId, key, name, description, is_creator_eligible, permissions, created_at, updated_at, ...metadata } = roleData;

    console.log(`🎭 Syncing role: ${name} (${clerkRoleId})`);

    // Find existing role
    let role = await this.roleRepository.findOne({
      where: [{ clerkRoleId }, { key }, { name }],
      relations: ['permissions'],
    });

    if (role) {
      // Update existing role
      role.key = key ?? role.key;
      role.name = name ?? role.name;
      role.description = description ?? role.description;
      role.clerkRoleId = clerkRoleId ?? role.clerkRoleId;
    } else {
      // Create new role
      role = this.roleRepository.create({
        clerkRoleId,
        key,
        name,
        description,
      });
    }

    // Sync permissions for this role
    if (permissions && permissions.length > 0) {
      let syncedPermissions = [];
      for (const permData of permissions) {
        const { id: clerkPermissionId, key, name, description, type, created_at, updated_at, ...metadata } = permData;

        console.log(`🔐 Syncing permission: ${name} (${clerkPermissionId})`);

        try {
          // Find existing permission
          let permission = await this.permissionRepository.findOne({
            where: { key },
          });

          if (permission) {
            // Update existing permission
            permission.key = key ?? permission.key;
            permission.name = name ?? permission.name;
            permission.description = description ?? permission.description;
            permission.clerkPermissionId = clerkPermissionId ?? permission.clerkPermissionId;
          } else {
            // Create new permission
            permission = this.permissionRepository.create({
              clerkPermissionId,
              key,
              name,
              description,
            });
          }

          permission = await this.permissionRepository.save(permission);

          console.log(`✅ Permission synced: ${permission.name}`);
          syncedPermissions.push(permission);
        } catch (error) {
          console.error(`❌ Error syncing permission ${name}:`, error);
          return null;
        }
      }
      role.permissions = syncedPermissions;
    }

    role = await this.roleRepository.save(role);

    console.log(`✅ Role synced: ${role.name} with ${role.permissions?.length || 0} permissions`);

    return {
      message: 'Role synced successfully',
      data: {
        role: {
          id: role.id,
          clerkRoleId: role.clerkRoleId,
          name: role.name,
          key: role.key,
          permissionCount: role.permissions?.length || 0,
        },
      },
    };
  }
}
