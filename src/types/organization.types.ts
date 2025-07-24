export enum DefaultRoleEnum {
  ADMIN = 'admin',
  STAFF = 'staff', 
  DOCTOR = 'doctor',
}

export interface RolePermissions {
  canAccessOrganizationData: boolean;
  canAccessTodayOnlyData: boolean;
  [key: string]: any; // Allow custom permissions
}

export interface OrganizationRole {
  name: string;
  permissions: RolePermissions;
  description?: string;
}

export interface OrganizationMetadata {
  roles?: OrganizationRole[];
  defaultRole?: string;
  settings?: Record<string, any>;
}

export interface ClerkOrganizationData {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  publicMetadata?: OrganizationMetadata;
  privateMetadata?: Record<string, any>;
}

export interface ClerkOrganizationMembershipData {
  id: string;
  organization: ClerkOrganizationData;
  publicMetadata?: {
    role?: string;
    permissions?: RolePermissions;
    customData?: Record<string, any>;
  };
  privateMetadata?: Record<string, any>;
  role: string; // This is Clerk's built-in role
}

export interface OrganizationMetadata {
  organizationId: string;
  role: string;
  permissions?: RolePermissions;
}

export interface UserOrganizationContext {
  userId: string;
  organizationId?: string;
  role: string;
  permissions: RolePermissions;
  isOrganizationUser: boolean;
  canAccessOrganizationData: boolean;
  canAccessTodayOnlyData: boolean;
}
