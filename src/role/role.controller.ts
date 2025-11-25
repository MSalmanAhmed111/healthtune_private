import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { SwaggerApiResponse } from '@decorators';
import {
  CreateRoleDto,
  UpdateRoleDto,
  SetRolePermissionsDto,
  CreateOrgRoleDto,
  UpdateOrgRoleDto,
  SetOrgRolePermissionsDto,
} from './dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { ApiMessageData } from '@types';
import { AuthType } from 'src/common/decorators/auth-type.decorator';
import { Request } from 'express';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ==================== ADMIN PORTAL - SYSTEM ROLES ====================

  @Get('admin/system-roles')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all system roles (Admin portal only)')
  async getAllRoles(): Promise<ApiMessageData> {
    return await this.roleService.getAllRoles();
  }

  @Get('admin/system-roles/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get system role by ID (Admin portal only)')
  async getRoleById(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.roleService.getRoleById(id);
  }

  @Delete('admin/system-roles/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete system role (Admin portal only)')
  async deleteRole(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.roleService.deleteRole(id);
  }

  // ==================== SHARED ENDPOINTS (Both Admin & Org:Admin) ====================

  @Get('permission/all')
  @AuthType(['admin', 'org:admin'])
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all available permissions (Shared)')
  async getAllPermissions(): Promise<ApiMessageData> {
    return await this.roleService.getAllPermissions();
  }

  @Post()
  @AuthType(['admin', 'org:admin'])
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create role - System role (admin) or Custom org role (org:admin)')
  async createRole(
    @Req() req: Request,
    @Body() createRoleDto: CreateRoleDto | CreateOrgRoleDto,
  ): Promise<ApiMessageData> {
    return await this.roleService.createSharedRole(req, createRoleDto);
  }

  @Put(':id')
  @AuthType(['admin', 'org:admin'])
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update role - System role (admin) or Custom org role (org:admin)')
  async updateRole(
    @Req() req: Request,
    @Param('id', ValidateId) id: number,
    @Body() updateRoleDto: UpdateRoleDto | UpdateOrgRoleDto,
  ): Promise<ApiMessageData> {
    return await this.roleService.updateSharedRole(req, id, updateRoleDto);
  }

  @Post(':roleId/set-permissions')
  @AuthType(['admin', 'org:admin'])
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Set permissions - System role (admin) or Custom org role (org:admin)')
  async setRolePermissions(
    @Req() req: Request,
    @Param('roleId', ValidateId) roleId: number,
    @Body() setPermissionsDto: SetRolePermissionsDto | SetOrgRolePermissionsDto,
  ): Promise<ApiMessageData> {
    return await this.roleService.setSharedRolePermissions(req, roleId, setPermissionsDto);
  }

  // ==================== ORG ADMIN PORTAL - CUSTOM ROLES ====================

  @Get('org-admin/roles')
  @AuthType('org:admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all custom roles for my organization (Org admin portal only)')
  async getMyOrgRoles(@Req() req: Request): Promise<ApiMessageData> {
    return await this.roleService.getMyOrgRoles(req);
  }

  @Get('org-admin/roles/:roleId')
  @AuthType('org:admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get organization role by ID (Org admin portal only)')
  async getMyOrgRoleById(
    @Req() req: Request,
    @Param('roleId', ValidateId) roleId: number,
  ): Promise<ApiMessageData> {
    return await this.roleService.getMyOrgRoleById(req, roleId);
  }

  @Delete('org-admin/roles/:roleId')
  @AuthType('org:admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete custom organization role (Org admin portal only)')
  async deleteMyOrgRole(
    @Req() req: Request,
    @Param('roleId', ValidateId) roleId: number,
  ): Promise<ApiMessageData> {
    return await this.roleService.deleteMyOrgRole(req, roleId);
  }
}

