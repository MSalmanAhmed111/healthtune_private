declare namespace Express {
  export interface Request {
    user: {
      id: number;
      organizationId: number | null;
      clerkOrganizationId: string | null;
      role: string | null;
    };
  }
}
