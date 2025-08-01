import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Patient, User, Appointment, Session } from '@entities';
import { RoleBasedAccessService } from './role-based-access.service';
import { PermissionEnum, UserOrganizationContext } from '@types';
import moment from 'moment-timezone';

@Injectable()
export class DataAccessService {
  constructor(private readonly roleBasedAccessService: RoleBasedAccessService) {}

  /**
   * Apply organization filters to patients query based on user role permissions
   */
  async applyPatientsOrganizationFilter(query: SelectQueryBuilder<Patient>, user: any, userId: number, alias = 'patient'): Promise<SelectQueryBuilder<Patient>> {
    // const context = await this.roleBasedAccessService.getUserOrganizationContext(user);
    // console.log({ context });
    // If user has organization-wide access
    const hasViewPatient = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_PATIENT);
    const hasViewAllPatients = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_ALL_PATIENTS);
    if (user && user.clerkOrganizationId && hasViewPatient && hasViewAllPatients) {
      return query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.clerkOrganizationId,
      });
    }

    // If user is restricted to their own patients only (no organization or restricted role)
    return query.andWhere(`patient.doctorId = :userId`, {
      userId: user.id,
    });
  }

  /**
   * Apply organization filters to appointments query based on user role permissions
   */
  async applyAppointmentsOrganizationFilter(query: SelectQueryBuilder<Appointment>, user: User, userId: number, alias = 'patient'): Promise<SelectQueryBuilder<Appointment>> {
    //const context = await this.roleBasedAccessService.getUserOrganizationContext(user);
    const hasViewAppointment = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_APPOINTMENT);
    const hasViewAllAppointment = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_ALL_APPOINTMENTS);
    // If user has organization-wide access
    if (user && user.clerkOrganizationId && hasViewAppointment && hasViewAllAppointment) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });

      // // If role requires today-only data, apply date filter
      // if (context.canAccessTodayOnlyData) {
      //   const today = new Date();
      //   const startOfToday = moment(today).startOf('day').toDate();
      //   const endOfToday = moment(today).endOf('day').toDate();

      //   query = query.andWhere(`${alias}.appointmentDate BETWEEN :startOfToday AND :endOfToday`, {
      //     startOfToday,
      //     endOfToday,
      //   });
      // }

      return query;
    }

    // Default: user can only see their own appointments
    query = query.andWhere(`appointment.doctorId = :userId`, {
      userId: user.id,
    });

    // If role requires today-only data, apply date filter
    // if (context.canAccessTodayOnlyData) {
    //   const today = new Date();
    //   const startOfToday = moment(today).startOf('day').toDate();
    //   const endOfToday = moment(today).endOf('day').toDate();

    //   query = query.andWhere(`${alias}.appointmentDate BETWEEN :startOfToday AND :endOfToday`, {
    //     startOfToday,
    //     endOfToday,
    //   });
    // }

    return query;
  }

  /**
   * Apply organization filters to sessions query based on user role permissions
   */
  async applySessionsOrganizationFilter(query: SelectQueryBuilder<Session>, user: User, userId: number, alias = 'session'): Promise<SelectQueryBuilder<Session>> {
    //const context = await this.roleBasedAccessService.getUserOrganizationContext(user);

    const hasViewSession = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_SESSION);
    const hasViewAllSessions = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_ALL_SESSIONS);

    // If user has organization-wide access
    if (user && user.clerkOrganizationId && hasViewSession && hasViewAllSessions) {
      query = query.andWhere(`${alias}.organizationId = :orgId`, {
        orgId: user.organizationId,
      });

      // If role requires today-only data, apply date filter
      // if (context.canAccessTodayOnlyData) {
      //   const today = new Date();
      //   const startOfToday = moment(today).startOf('day').toDate();
      //   const endOfToday = moment(today).endOf('day').toDate();

      //   query = query.andWhere(`${alias}.createdAt BETWEEN :startOfToday AND :endOfToday`, {
      //     startOfToday,
      //     endOfToday,
      //   });
      // }

      return query;
    }

    // Default: user can only see their own sessions
    query = query.andWhere(`session.userId = :userId`, {
      userId: user.id,
    });

    // If role requires today-only data, apply date filter
    // if (context.canAccessTodayOnlyData) {
    //   const today = new Date();
    //   const startOfToday = moment(today).startOf('day').toDate();
    //   const endOfToday = moment(today).endOf('day').toDate();

    //   query = query.andWhere(`${alias}.createdAt BETWEEN :startOfToday AND :endOfToday`, {
    //     startOfToday,
    //     endOfToday,
    //   });
    // }

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
