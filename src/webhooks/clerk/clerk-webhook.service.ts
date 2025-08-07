import { Repository, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, Setting, User, UserPlan, UserPlanUsage, Organization, Role, Permission } from '@entities';
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
          console.log(`🎭 Role created: ${eventData.name} (${eventData.id})`);
          return await this.syncRole(eventData);

        case 'role.deleted':
          console.log(`🎭 Role deleted: ${eventData.id}`);
          return await this.handleRoleDeleted(eventData);

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

      // ===> to be removed later (using to sync existing user stripe customer ids)
      if (!user.stripeCustomerId) {
        user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`);
        user = await this.userRepository.save(user);
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
    await this.userRepository.save({
      id: user.id,
      userPlanId: userPlan.id,
    });
    //await this.userRepository.save(user);
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

    // Check if organization already exists
    let organization = await this.organizationRepository.findOne({
      where: { clerkOrganizationId: id },
    });

    if (organization) {
      console.log(`⚠️ Organization already exists, updating instead`);
      return await this.handleOrganizationUpdated(eventData);
    }

    // Create new organization
    organization = this.organizationRepository.create({
      clerkOrganizationId: id,
      name,
      slug,
      imageUrl: image_url,
      publicMetadata: public_metadata,
      privateMetadata: private_metadata,
      createdAt: created_at ? new Date(created_at) : new Date(),
    });

    organization = await this.organizationRepository.save(organization);
    console.log(`✅ Organization created with ID: ${organization.id}`);

    // Set creator as admin and setup default roles
    if (created_by) {
      console.log(`👑 Setting creator as admin...`);
      await this.setOrganizationCreatorAsAdmin(created_by, organization);
    }

    return {
      message: 'Organization created successfully with admin assigned',
      data: {
        organization,
        adminAssigned: !!created_by,
        defaultRolesCreated: !public_metadata?.roles,
      },
    };
  }

  /**
   * Handle organization update event specifically
   */
  private async handleOrganizationUpdated(eventData: any): Promise<ApiMessageData> {
    const { id, name, slug, image_url, public_metadata, private_metadata, updated_at } = eventData;

    console.log(`🏢 Updating organization: ${name} (${id})`);

    let organization = await this.organizationRepository.findOne({
      where: { clerkOrganizationId: id },
    });

    if (!organization) {
      console.log(`⚠️ Organization not found, creating instead`);
      return await this.handleOrganizationCreated(eventData);
    }

    // Update organization data
    organization.name = name ?? organization.name;
    organization.slug = slug ?? organization.slug;
    organization.imageUrl = image_url ?? organization.imageUrl;
    organization.publicMetadata = public_metadata ?? organization.publicMetadata;
    organization.privateMetadata = private_metadata ?? organization.privateMetadata;

    organization = await this.organizationRepository.save(organization);
    console.log(`✅ Organization updated`);

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

      console.log(`👤 Processing user: ${public_user_data.identifier} (${user_id})`);
      console.log(`🏢 Organization: ${organization.name} (${organization_id})`);
      console.log(`🎭 Role: ${role_name} (${role})`);
      console.log(`🔐 Permissions:`, permissions);

      // Retry finding the user with timer to handle concurrent user creation
      const user = await this.findUserWithRetry(user_id, 5, 25000);

      if (user) {
        // Find or create organization if it doesn't exist
        let orgEntity = await this.organizationRepository.findOne({
          where: { clerkOrganizationId: organization_id },
        });

        if (!orgEntity) {
          console.log(`🏢 Organization not found, creating: ${organization.name}`);
          orgEntity = await this.createOrganizationFromMembership(organization);
        }

        // Update user with organization membership
        user.organization = orgEntity;
        user.organizationId = orgEntity.id;
        user.clerkOrganizationId = organization_id;
        user.roleId = (await this.getDefaultRole(role.toLowerCase())) || (await this.getDefaultRole(role.toLowerCase())) || (await this.getDefaultRole(DefaultRoleEnum.ADMIN));
        console.log({role_name, role, roleId: user.roleId})
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

      // Update user with organization info
      user.organizationId = organization.id;
      user.clerkOrganizationId = organization_id;
      user.roleId = (await this.getDefaultRole(role)) || (await this.getDefaultRole(role)) || (await this.getDefaultRole(DefaultRoleEnum.DOCTOR));

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

    // Create basic user record
    const newUser = this.userRepository.create({
      email: email_address,
      clerkUserId: `pending_${invitationId}`,
      organizationId: organization?.id || null,
      clerkOrganizationId: organization_id,
      roleId: (await this.getDefaultRole(role)) || (await this.getDefaultRole(role)) || (await this.getDefaultRole(DefaultRoleEnum.DOCTOR)),
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
    const organization = this.organizationRepository.create({
      clerkOrganizationId: organizationData.id,
      name: organizationData.name,
      slug: organizationData.slug,
      imageUrl: organizationData.image_url,
      publicMetadata: organizationData.public_metadata,
      privateMetadata: organizationData.private_metadata,
      createdAt: organizationData.created_at ? new Date(organizationData.created_at) : new Date(),
    });

    const savedOrg = await this.organizationRepository.save(organization);

    console.log(`✅ Organization created from membership: ${savedOrg.name}`);
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
   * Set the organization creator as admin
   */
  private async setOrganizationCreatorAsAdmin(creatorClerkUserId: string, organization: Organization): Promise<void> {
    try {
      // Find the user who created the organization
      const creatorUser = await this.userRepository.findOne({
        where: { clerkUserId: creatorClerkUserId },
      });

      if (creatorUser) {
        // Set the creator as admin of the organization
        creatorUser.organization = organization;
        creatorUser.organizationId = organization.id;
        creatorUser.clerkOrganizationId = organization.clerkOrganizationId;
        creatorUser.roleId = await this.getDefaultRole(`org:${DefaultRoleEnum.ADMIN}`);

        await this.userRepository.save(creatorUser);

        console.log(`Set user ${creatorUser.email} as admin of organization ${organization.name}`);
      } else {
        console.warn(`Creator user not found with Clerk ID: ${creatorClerkUserId}`);
      }
    } catch (error) {
      console.error('Error setting organization creator as admin:', error);
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
      where: [{ clerkRoleId }, { key }, {name}],
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
