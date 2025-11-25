import { verifyToken } from '@clerk/backend';
import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ClerkClient } from '@clerk/backend';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, User } from '@entities';
import { DefaultRoleEnum } from '@types';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }

  async validate(req: Request): Promise<{
    id: number;
    organizationId: number | null;
    clerkOrganizationId: string | null;
    role: Role;
    userRole?: string;
  }> {
    const token = req.headers.authorization?.split(' ').pop();
    const organizationIdHeader = req.headers['x-organization-id'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const clerkSecretKey = this.configService.get('creds.clerkSecretKey');

      const decoded = this.jwtService.decode(token, { complete: true });
      if (!decoded || !decoded.payload?.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const tokenPayload = await verifyToken(token, { secretKey: clerkSecretKey });
      if (!tokenPayload || !tokenPayload?.sub) throw new UnauthorizedException('Invalid token payload');

      let fetchedUser = await this.userRepository.findOne({
        where: { clerkUserId: tokenPayload.sub },
        relations: ['organization', 'role', 'role.permissions'],
      });
      if (!fetchedUser) throw new NotFoundException('User not found with clerkId: ' + tokenPayload.sub);

      // Extract userRole from token claims (set in Clerk Dashboard)
      let userRoleFromToken = tokenPayload?.userRole as string | undefined;

      // If userRole not in token, fetch from Clerk API using organization membership
      if (!userRoleFromToken && (organizationIdHeader || fetchedUser.clerkOrganizationId)) {
        try {
          const clerkOrgId = organizationIdHeader || fetchedUser.clerkOrganizationId;

          // Fetch organization members from Clerk to find this user's membership
          const orgMembers = await this.clerkClient.organizations.getOrganizationMembershipList({
            organizationId: clerkOrgId,
          });

          // Find the membership for this user
          if (orgMembers.data && orgMembers.data.length > 0) {
            const membership = orgMembers.data.find(
              m => m.publicUserData?.userId === tokenPayload.sub
            );

            if (membership && membership.publicMetadata) {
              userRoleFromToken = membership.publicMetadata?.userRole as string | undefined;
            }
          }
        } catch (clerkError) {
          console.error(`Error fetching user role from Clerk API:`, clerkError.message);
        }
      }

      // Ensure role and permissions are properly loaded
      if (!fetchedUser.role && userRoleFromToken) {
        try {
          // Look up the role by its key
          const dbRole = await this.roleRepository.findOne({
            where: { key: userRoleFromToken },
            relations: ['permissions'],
          });

          if (dbRole) {
            // Update user's roleId if missing
            if (!fetchedUser.roleId) {
              // Save the user with the new roleId
              await this.userRepository.update({ id: fetchedUser.id }, { roleId: dbRole.id });
              
              // Reload the user to ensure we have fresh data
              const updatedUser = await this.userRepository.findOne({
                where: { id: fetchedUser.id },
                relations: ['organization', 'role', 'role.permissions'],
              });
              
              if (updatedUser) {
                fetchedUser = updatedUser;
              }
            } else {
              fetchedUser.role = dbRole;
            }
          }
        } catch (roleError) {
          console.error(`Error resolving user role from Clerk data:`, roleError.message);
        }
      }

      const result = {
        id: fetchedUser.id,
        organizationId: fetchedUser.organizationId,
        clerkOrganizationId: fetchedUser.clerkOrganizationId,
        role: fetchedUser.role,
        userRole: userRoleFromToken,
      };

      return result;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
