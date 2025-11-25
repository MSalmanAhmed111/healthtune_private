import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Patient, User, Appointment, Session } from '@entities';
import { RoleBasedAccessService } from './role-based-access.service';
import { PermissionEnum } from '@types';

@Injectable()
export class DataAccessService {
  constructor(private readonly roleBasedAccessService: RoleBasedAccessService) {}

  /**
   * Apply organization filters to patients query based on user role permissions
   */
  async applyPatientsOrganizationFilter(query: SelectQueryBuilder<Patient>, user: any, userId: number, alias = 'patient'): Promise<SelectQueryBuilder<Patient>> {
    // Safeguard: ensure permissions exist
    if (!user?.role?.permissions || user.role.permissions.length === 0) {
      return query.andWhere(`${alias}.doctorId = :userId`, { userId: user?.id });
    }

    const hasViewPatient = user.role.permissions.some((p) => p.key === PermissionEnum.VIEW_PATIENT);
    const hasViewAllPatients = user.role.permissions.some((p) => p.key === PermissionEnum.VIEW_ALL_PATIENTS);

    // If user has VIEW_ALL_PATIENTS permission and organization access
    if (user?.clerkOrganizationId && hasViewAllPatients) {
      return query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });
    }

    // If user has VIEW_PATIENT permission (but not all) and organization access
    if (user?.clerkOrganizationId && hasViewPatient && !hasViewAllPatients) {
      return query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });
    }

    // Default: restrict to own patients only
    return query.andWhere(`${alias}.doctorId = :userId`, {
      userId: user.id,
    });
  }

  /**
   * Apply organization filters to appointments query based on user role permissions
   */
  async applyAppointmentsOrganizationFilter(query: SelectQueryBuilder<Appointment>, user: User, userId: number, alias = 'appointment'): Promise<SelectQueryBuilder<Appointment>> {
    // Safeguard: ensure permissions exist
    if (!user?.role?.permissions || user.role.permissions.length === 0) {
      return query.andWhere(`${alias}.doctorId = :userId`, { userId: user.id });
    }

    const hasViewAllAppointment = user.role.permissions.some((p) => p.key === PermissionEnum.VIEW_ALL_APPOINTMENTS);

    // If user has organization-wide access
    if (user?.clerkOrganizationId && hasViewAllAppointment) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });
      return query;
    }

    // Default: user can only see their own appointments
    query = query.andWhere(`${alias}.doctorId = :userId`, {
      userId: user.id,
    });

    return query;
  }

  /**
   * Apply organization filters to sessions query based on user role permissions
   */
  async applySessionsOrganizationFilter(query: SelectQueryBuilder<Session>, user: User, userId: number, alias = 'session'): Promise<SelectQueryBuilder<Session>> {
    // Safeguard: ensure permissions exist
    if (!user?.role?.permissions || user.role.permissions.length === 0) {
      return query.andWhere(`${alias}.userId = :userId`, { userId: user.id });
    }

    const hasViewAllSessions = user.role.permissions.some((p) => p.key === PermissionEnum.VIEW_ALL_SESSIONS);

    if (user?.clerkOrganizationId && hasViewAllSessions) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });
      return query;
    }

    // Default: user can only see their own sessions
    query = query.andWhere(`${alias}.userId = :userId`, {
      userId: user.id,
    });

    return query;
  }

  /**
   * Check if user can access a specific resource within their organization
   */
  async canAccessResource(user: User, resourceUserId: number, resourceOrganizationId?: string): Promise<boolean> {
    const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    // If user has organization-wide access and resource belongs to same organization
    if (context.isOrganizationUser && resourceOrganizationId === context.clerkOrganizationId) {
      return true;
    }

    // User can access their own resources
    return resourceUserId == context.userId;
  }
}
