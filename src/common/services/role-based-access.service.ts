import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultRoleEnum, UserOrganizationContext, RolePermissions, OrganizationRole } from '@types';
import { User, Organization } from '@entities';

@Injectable()
export class RoleBasedAccessService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Get user organization context with dynamic role permissions
   */
  async getUserOrganizationContext(user: User): Promise<UserOrganizationContext> {
    const userId = user.id;
    const clerkOrganizationId = user.clerkOrganizationId;
    const userRole = user.role;
    const customPermissions = user?.role?.permissions;

    // If no organization, use default doctor permissions
    if (!clerkOrganizationId || !userRole) {
      const defaultPermissions = this.getDefaultDoctorPermissions();
      return {
        userId,
        isOrganizationUser: false,
        organizationId: null,
        clerkOrganizationId: null,
        role: null,
        permissions: null,
      };
    }

    // Get organization-specific role permissions

    return {
      userId,
      isOrganizationUser: !!clerkOrganizationId,
      clerkOrganizationId: clerkOrganizationId,
      organizationId: user.organizationId,
      role: userRole,
      permissions: customPermissions,
    };
  }

  /**
   * Get permissions for a role within an organization
   */

  /**
   * Get system default permissions for backward compatibility
   */
  private getSystemDefaultPermissions(role: string): RolePermissions {
    const roleMap: Record<string, RolePermissions> = {
      admin: {
        canAccessOrganizationData: true,
        canAccessTodayOnlyData: false,
      },
      staff: {
        canAccessOrganizationData: true,
        canAccessTodayOnlyData: false,
      },
      doctor: {
        canAccessOrganizationData: false,
        canAccessTodayOnlyData: true,
      },
    };
    return roleMap[role.toLowerCase()] || this.getDefaultDoctorPermissions();
  }

  /**
   * Default doctor permissions
   */
  private getDefaultDoctorPermissions(): RolePermissions {
    return {
      canAccessOrganizationData: false,
      canAccessTodayOnlyData: true,
    };
  }

  /**
   * Validate role permissions object
   */
  private isValidRolePermissions(permissions: any): permissions is RolePermissions {
    return permissions && typeof permissions === 'object' && typeof permissions.canAccessOrganizationData === 'boolean' && typeof permissions.canAccessTodayOnlyData === 'boolean';
  }

  /**
   * Get patients access filter based on user context
   */
  // getPatientsAccessFilter(userContext: UserOrganizationContext, userId: number) {
  //   if (!userContext.isOrganizationUser) {
  //     // Non-organization users can only see their own patients
  //     return { doctorId: userId };
  //   }

  //   if (userContext.canAccessOrganizationData) {
  //     // Staff and Admin can see all organization patients
  //     return { organizationWide: true };
  //   }

  //   // Doctors in organization can only see their own patients
  //   return { doctorId: userId };
  // }

  /**
   * Get appointments access filter based on user context
   */
  // getAppointmentsAccessFilter(userContext: UserOrganizationContext, userId: number) {
  //   const filter: any = {};

  //   if (!userContext.isOrganizationUser) {
  //     // Non-organization users can only see their own appointments
  //     filter.doctorId = userId;
  //     return filter;
  //   }

  //   if (userContext.canAccessOrganizationData) {
  //     // Staff and Admin can see all organization appointments
  //     filter.organizationWide = true;
  //   } else {
  //     // Doctors in organization can only see their own appointments
  //     filter.doctorId = userId;
  //   }

  //   // Doctors get today-only restriction
  //   if (userContext.canAccessTodayOnlyData) {
  //     filter.todayOnly = true;
  //   }

  //   return filter;
  // }

  /**
   * Get sessions access filter based on user context
   */
  // getSessionsAccessFilter(userContext: UserOrganizationContext, userId: number) {
  //   if (!userContext.isOrganizationUser) {
  //     // Non-organization users can only see their own sessions
  //     return { userId };
  //   }

  //   if (userContext.canAccessOrganizationData) {
  //     // Staff and Admin can see all organization sessions
  //     return { organizationWide: true };
  //   }

  //   // Doctors in organization can only see their own sessions
  //   return { userId };
  // }

  // /**
  //  * Check if user can create/edit patients
  //  */
  // canManagePatients(userContext: UserOrganizationContext): boolean {
  //   if (!userContext.isOrganizationUser) {
  //     return true; // Non-organization users can manage their patients
  //   }

  //   // In organization: Admin, Staff, and Doctors can manage patients
  //   return [DefaultRoleEnum.ADMIN, DefaultRoleEnum.STAFF, DefaultRoleEnum.DOCTOR].includes(userContext.role as DefaultRoleEnum);
  // }

  // /**
  //  * Check if user can create/edit appointments
  //  */
  // canManageAppointments(userContext: UserOrganizationContext): boolean {
  //   if (!userContext.isOrganizationUser) {
  //     return true; // Non-organization users can manage their appointments
  //   }

  //   // In organization: Admin, Staff, and Doctors can manage appointments
  //   return [DefaultRoleEnum.ADMIN, DefaultRoleEnum.STAFF].includes(userContext.role as DefaultRoleEnum);
  // }

  // /**
  //  * Get organization users filter (for getting doctors list etc.)
  //  */
  // getOrganizationUsersFilter(userContext: UserOrganizationContext) {
  //   if (!userContext.isOrganizationUser) {
  //     return null; // Non-organization users don't see other users
  //   }

  //   return {
  //     clerkOrganizationId: userContext.organizationId,
  //   };
  // }
}
