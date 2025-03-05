import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SwaggerApiResponse } from '@decorators';
import { PaginationUserQueryDto, UpdateUserDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
  ) {}

  @Get('/user')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all users')
  async getUsers(@Query() queryParams: PaginationUserQueryDto) {
    return await this.userService.getUsers(queryParams);
  }

  @Get('/user/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUser(@Param('id', ValidateId) id: number) {
    return await this.userService.getUser(id);
  }

  @Put('/user/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update user')
  async updateUser(@Param('id', ValidateId) id: number, @Body() reqBody: UpdateUserDto) {
    return await this.userService.updateUser(id, reqBody);
  }
}
