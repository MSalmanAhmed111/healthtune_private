import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { SwaggerApiResponse } from '@decorators';
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto } from './dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { ApiMessageData } from '@types';
import { AuthType } from 'src/common/decorators/auth-type.decorator';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ==================== ROLE MANAGEMENT ====================

  @Get()
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all roles')
  async getAllRoles(): Promise<ApiMessageData> {
    return await this.roleService.getAllRoles();
  }

  @Get(':id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get role by ID')
  async getRoleById(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.roleService.getRoleById(id);
  }

  @Post()
  @AuthType('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create new role')
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<ApiMessageData> {
    return await this.roleService.createRole(createRoleDto);
  }

  @Put(':id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update role')
  async updateRole(@Param('id', ValidateId) id: number, @Body() updateRoleDto: UpdateRoleDto): Promise<ApiMessageData> {
    return await this.roleService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete role')
  async deleteRole(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.roleService.deleteRole(id);
  }

  // ==================== PERMISSION MANAGEMENT ====================

  @Get('permission/all')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all permissions')
  async getAllPermissions(): Promise<ApiMessageData> {
    return await this.roleService.getAllPermissions();
  }

  @Post(':roleId/set-permissions')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Set role permissions - grants new permissions and revokes removed ones')
  async setRolePermissions(
    @Param('roleId', ValidateId) roleId: number,
    @Body() setPermissionsDto: SetRolePermissionsDto,
  ): Promise<ApiMessageData> {
    return await this.roleService.setRolePermissions(roleId, setPermissionsDto);
  }
}
