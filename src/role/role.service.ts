import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '@entities';
import { ApiMessageData } from '@types';
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto, CreateOrgRoleDto, UpdateOrgRoleDto, SetOrgRolePermissionsDto } from './dto';
import { roleMessages, roleErrorMessages } from './messages/role.messages';
import { Request } from 'express';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // ==================== SYSTEM ROLES (Admin only) ====================

  async getAllRoles(): Promise<ApiMessageData> {
    try {
      const roles = await this.roleRepository.find({
        where: { organizationId: null },
        relations: ['permissions'],
        order: { createdAt: 'DESC' },
      });

      return {
        message: roleMessages.rolesRetrieved,
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching roles: ${error.message}`);
    }
  }

  async getRoleById(id: number): Promise<ApiMessageData> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id, organizationId: null },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      return {
        message: 'Role retrieved successfully',
        data: role,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error fetching role: ${error.message}`);
    }
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<ApiMessageData> {
    try {
      const { key, name, description, permissionIds } = createRoleDto;

      // Check if key already exists for system roles
      const existingRole = await this.roleRepository.findOne({
        where: { key, organizationId: null },
      });
      if (existingRole) {
        throw new BadRequestException(roleErrorMessages.roleKeyAlreadyExists);
      }

      // Get permissions
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
      }

      // Create system role
      const role = this.roleRepository.create({
        key,
        name,
        description,
        permissions,
        organizationId: null,
        isSystemRole: true,
      });

      const savedRole = await this.roleRepository.save(role);

      return {
        message: roleMessages.roleCreated,
        data: { ...savedRole, permissions },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(roleErrorMessages.roleCreationFailed);
    }
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<ApiMessageData> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id, organizationId: null },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      const { name, description, permissionIds } = updateRoleDto;

      // Update basic fields
      if (name) role.name = name;
      if (description !== undefined) role.description = description;

      // Update permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findByIds(permissionIds);
        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
        }
        role.permissions = permissions;
      }

      const updatedRole = await this.roleRepository.save(role);

      return {
        message: roleMessages.roleUpdated,
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(roleErrorMessages.roleUpdateFailed);
    }
  }

  async deleteRole(id: number): Promise<ApiMessageData> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id, organizationId: null },
        relations: ['users'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      // Check if role has users assigned
      if (role.users && role.users.length > 0) {
        throw new BadRequestException(roleErrorMessages.cannotDeleteRoleWithUsers);
      }

      await this.roleRepository.remove(role);

      return {
        message: roleMessages.roleDeleted,
        data: { roleId: id },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(roleErrorMessages.roleDeletionFailed);
    }
  }

  // ==================== SHARED (Available to all roles) ====================

  async getAllPermissions(): Promise<ApiMessageData> {
    try {
      const permissions = await this.permissionRepository.find({
        order: { createdAt: 'DESC' },
      });

      return {
        message: roleMessages.permissionsRetrieved,
        data: permissions,
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching permissions: ${error.message}`);
    }
  }

  async setRolePermissions(roleId: number, setPermissionsDto: SetRolePermissionsDto): Promise<ApiMessageData> {
    try {
      const { permissionIds } = setPermissionsDto;

      const role = await this.roleRepository.findOne({
        where: { id: roleId, organizationId: null },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      // Get all requested permissions
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
      }

      // Get current permission IDs
      const currentPermissionIds = role.permissions.map(p => p.id);

      // Find permissions to add (in requested but not in current)
      const permissionsToAdd = permissions.filter(p => !currentPermissionIds.includes(p.id));

      // Find permissions to remove (in current but not in requested)
      const permissionsToRemove = role.permissions.filter(p => !permissionIds.includes(p.id));

      // Update role permissions
      role.permissions = permissions;

      const updatedRole = await this.roleRepository.save(role);

      return {
        message: 'Role permissions updated successfully',
        data: {
          role: updatedRole,
          addedPermissions: permissionsToAdd.map(p => ({ id: p.id, name: p.name })),
          removedPermissions: permissionsToRemove.map(p => ({ id: p.id, name: p.name })),
          totalPermissions: updatedRole.permissions.length,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error setting role permissions: ${error.message}`);
    }
  }

  // ==================== ORG-ADMIN PORTAL METHODS (Auto-scoped to user's org) ====================

  async getMyOrgRoles(req: Request): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);

      const roles = await this.roleRepository.find({
        where: { organizationId },
        relations: ['permissions'],
        order: { createdAt: 'DESC' },
      });

      return {
        message: 'Your organization roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error fetching organization roles: ${error.message}`);
    }
  }

  async getMyOrgRoleById(req: Request, roleId: number): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);

      const role = await this.roleRepository.findOne({
        where: { id: roleId, organizationId },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      return {
        message: 'Organization role retrieved successfully',
        data: role,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error fetching organization role: ${error.message}`);
    }
  }

  async createMyOrgRole(req: Request, createOrgRoleDto: CreateOrgRoleDto): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);
      const { name, description, permissionIds } = createOrgRoleDto;

      // Generate unique key for org role: org_{orgId}_{name_slug}_{timestamp}
      const nameSlug = name.toLowerCase().replace(/\s+/g, '_');
      const key = `org_${organizationId}_${nameSlug}_${Date.now()}`;

      // Get permissions
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
      }

      // Create organization role
      const role = this.roleRepository.create({
        key,
        name,
        description,
        permissions,
        organizationId,
        isSystemRole: false,
      });

      const savedRole = await this.roleRepository.save(role);

      return {
        message: 'Organization role created successfully',
        data: { ...savedRole, permissions },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error creating organization role: ${error.message}`);
    }
  }

  async updateMyOrgRole(req: Request, roleId: number, updateOrgRoleDto: UpdateOrgRoleDto): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);

      const role = await this.roleRepository.findOne({
        where: { id: roleId, organizationId },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      const { name, description } = updateOrgRoleDto;
      if (name) role.name = name;
      if (description) role.description = description;

      const updatedRole = await this.roleRepository.save(role);

      return {
        message: 'Organization role updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error updating organization role: ${error.message}`);
    }
  }

  async deleteMyOrgRole(req: Request, roleId: number): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);

      const role = await this.roleRepository.findOne({
        where: { id: roleId, organizationId },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      await this.roleRepository.remove(role);

      return {
        message: 'Organization role deleted successfully',
        data: { id: roleId },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error deleting organization role: ${error.message}`);
    }
  }

  async setMyOrgRolePermissions(req: Request, roleId: number, setPermissionsDto: SetOrgRolePermissionsDto): Promise<ApiMessageData> {
    try {
      const organizationId = this.getUserOrganizationId(req);
      const { permissionIds } = setPermissionsDto;

      const role = await this.roleRepository.findOne({
        where: { id: roleId, organizationId },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(roleErrorMessages.roleNotFound);
      }

      // Get all requested permissions
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
      }

      // Calculate which permissions to add/remove
      const existingPermIds = role.permissions.map(p => p.id);
      const permissionsToAdd = permissions.filter(p => !existingPermIds.includes(p.id));
      const permissionsToRemove = role.permissions.filter(p => !permissionIds.includes(p.id));

      // Update permissions
      role.permissions = permissions;
      const updatedRole = await this.roleRepository.save(role);

      return {
        message: 'Role permissions updated successfully',
        data: {
          role: updatedRole,
          addedPermissions: permissionsToAdd.map(p => ({ id: p.id, name: p.name })),
          removedPermissions: permissionsToRemove.map(p => ({ id: p.id, name: p.name })),
          totalPermissions: updatedRole.permissions.length,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error setting role permissions: ${error.message}`);
    }
  }

  // ==================== SHARED METHODS (Works for both system and org roles) ====================
  private getUserOrganizationId(req: Request): number {
    const userOrgId = (req as any).user?.organizationId;

    if (userOrgId) {
      return userOrgId;
    }

    const orgIdHeader = req.headers['x-organization-id'] as string | undefined;
    if (orgIdHeader && !isNaN(parseInt(orgIdHeader))) {
      const orgId = parseInt(orgIdHeader);
      return orgId;
    }
    throw new BadRequestException('Organization ID not found in request');
  }

  private isOrgAdmin(req: Request): boolean {
    // Check if endpoint allows org:admin auth type from @AuthType decorator
    const authType = (req as any).authType;
    

    // Check if authType includes or equals 'org:admin'
    let isOrgAdminEndpoint = false;
    
    if (typeof authType === 'string') {
      isOrgAdminEndpoint = authType === 'org:admin';
    } else if (Array.isArray(authType)) {
      isOrgAdminEndpoint = authType.includes('org:admin');
    }

  if (isOrgAdminEndpoint && Array.isArray(authType) && authType.includes('admin')) {
      const userOrgId = (req as any).user?.organizationId;
      if (!userOrgId) {
        return false;
      }
    }

    return isOrgAdminEndpoint;
  }

  async createSharedRole(req: Request, createRoleDto: CreateRoleDto | CreateOrgRoleDto): Promise<ApiMessageData> {
    if (this.isOrgAdmin(req)) {
      return await this.createMyOrgRole(req, createRoleDto as CreateOrgRoleDto);
    } else {
      return await this.createRole(createRoleDto as CreateRoleDto);
    }
  }

  async updateSharedRole(req: Request, id: number, updateRoleDto: UpdateRoleDto | UpdateOrgRoleDto): Promise<ApiMessageData> {
    if (this.isOrgAdmin(req)) {
      return await this.updateMyOrgRole(req, id, updateRoleDto as UpdateOrgRoleDto);
    } else {
      return await this.updateRole(id, updateRoleDto as UpdateRoleDto);
    }
  }

  async setSharedRolePermissions(req: Request, roleId: number, setPermissionsDto: SetRolePermissionsDto | SetOrgRolePermissionsDto): Promise<ApiMessageData> {
    if (this.isOrgAdmin(req)) {
      return await this.setMyOrgRolePermissions(req, roleId, setPermissionsDto as SetOrgRolePermissionsDto);
    } else {
      return await this.setRolePermissions(roleId, setPermissionsDto as SetRolePermissionsDto);
    }
  }
}


