import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Patient, User, Appointment, Session } from '@entities';
import { startOfDay, endOfDay } from 'date-fns';
import { RoleBasedAccessService } from './role-based-access.service';

@Injectable()
export class DataAccessService {
  constructor(
    private readonly roleBasedAccessService: RoleBasedAccessService,
  ) {}

  /**
   * Apply organization filters to patients query based on user role permissions
   */
  async applyPatientsOrganizationFilter(
    query: SelectQueryBuilder<Patient>,
    user: User,
    userId: string,
    alias = 'patient'
  ): Promise<SelectQueryBuilder<Patient>> {
    const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    // If user has organization-wide access
    if (context.isOrganizationUser && context.canAccessOrganizationData) {
      return query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: context.organizationId,
      });
    }

    // If user is restricted to their own patients only (no organization or restricted role)
    return query.andWhere(`${alias}.userId = :userId`, {
      userId: context.userId,
    });
  }

  /**
   * Apply organization filters to appointments query based on user role permissions
   */
  async applyAppointmentsOrganizationFilter(
    query: SelectQueryBuilder<Appointment>,
    user: User,
    userId: string,
    alias = 'appointment'
  ): Promise<SelectQueryBuilder<Appointment>> {
    const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    // If user has organization-wide access
    if (context.isOrganizationUser && context.canAccessOrganizationData) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: context.organizationId,
      });
      
      // If role requires today-only data, apply date filter
      if (context.canAccessTodayOnlyData) {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        
        query = query.andWhere(`${alias}.appointmentDate BETWEEN :startOfToday AND :endOfToday`, {
          startOfToday,
          endOfToday,
        });
      }
      
      return query;
    }

    // Default: user can only see their own appointments
    query = query.andWhere(`${alias}.userId = :userId`, {
      userId: context.userId,
    });

    // If role requires today-only data, apply date filter
    if (context.canAccessTodayOnlyData) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      query = query.andWhere(`${alias}.appointmentDate BETWEEN :startOfToday AND :endOfToday`, {
        startOfToday,
        endOfToday,
      });
    }

    return query;
  }

  /**
   * Apply organization filters to sessions query based on user role permissions
   */
  async applySessionsOrganizationFilter(
    query: SelectQueryBuilder<Session>,
    user: User,
    userId: string,
    alias = 'session'
  ): Promise<SelectQueryBuilder<Session>> {
    const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    // If user has organization-wide access
    if (context.isOrganizationUser && context.canAccessOrganizationData) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: context.organizationId,
      });
      
      // If role requires today-only data, apply date filter
      if (context.canAccessTodayOnlyData) {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        
        query = query.andWhere(`${alias}.createdAt BETWEEN :startOfToday AND :endOfToday`, {
          startOfToday,
          endOfToday,
        });
      }
      
      return query;
    }

    // Default: user can only see their own sessions
    query = query.andWhere(`${alias}.userId = :userId`, {
      userId: context.userId,
    });

    // If role requires today-only data, apply date filter
    if (context.canAccessTodayOnlyData) {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      query = query.andWhere(`${alias}.createdAt BETWEEN :startOfToday AND :endOfToday`, {
        startOfToday,
        endOfToday,
      });
    }

    return query;
  }

  /**
   * Check if user can access a specific resource within their organization
   */
  async canAccessResource(
    user: User,
    resourceUserId: string,
    resourceOrganizationId?: string
  ): Promise<boolean> {
    const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    // If user has organization-wide access and resource belongs to same organization
    if (
      context.isOrganizationUser && 
      context.canAccessOrganizationData && 
      resourceOrganizationId === context.organizationId
    ) {
      return true;
    }

    // User can access their own resources
    return resourceUserId == context.userId;
  }
}
