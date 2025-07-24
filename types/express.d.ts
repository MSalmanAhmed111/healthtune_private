declare namespace Express {
  export interface Request {
    user: {
      id: number;
      metaData: Record<string, any>;
      organizationId?: number;
      clerkOrganizationId?: string;
      role: string;
      rolePermissions?: string[];
    };
  }
}
