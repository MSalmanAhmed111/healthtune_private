import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '@entities';
import { ApiMessageData } from '@types';
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto } from './dto';
import { roleMessages, roleErrorMessages } from './messages/role.messages';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async getAllRoles(): Promise<ApiMessageData> {
    try {
      const roles = await this.roleRepository.find({
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
        where: { id },
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

      // Check if key already exists
      const existingRole = await this.roleRepository.findOne({ where: { key } });
      if (existingRole) {
        throw new BadRequestException(roleErrorMessages.roleKeyAlreadyExists);
      }

      // Get permissions
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(roleErrorMessages.invalidPermissionIds);
      }

      // Create role
      const role = this.roleRepository.create({
        key,
        name,
        description,
        permissions,
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
        where: { id },
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
        where: { id },
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
        where: { id: roleId },
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
}
