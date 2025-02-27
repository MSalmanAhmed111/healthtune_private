import { Controller, Get, Param, HttpCode, HttpStatus, Query, Req, Body, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { SwaggerApiResponse } from '@decorators';
import { PaginationUserQueryDto, UpdateCurrentUserDto, UpdateUserDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get current user')
  async getCurrentUser(@Req() req: Request) {
    return await this.userService.getUser(+req.user.id);
  }

  @Put('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update current user')
  async updateCurrentUser(@Req() req: Request, @Body() reqBody: UpdateCurrentUserDto) {
    return await this.userService.updateCurrentUser(+req.user.id, reqBody);
  }

  // ? ADMIN APIS
  // @Get('/')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get all user sessions')
  // async getUsers(@Query() queryParams: PaginationUserQueryDto, @Req() req: Request) {
  //   return await this.userService.getUsers(queryParams);
  // }

  // @Get('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get a user session')
  // async getUser(@Param('id', ValidateId) id: number) {
  //   return await this.userService.getUser(id);
  // }

  // @Put('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get current user')
  // async updateUser(@Req() req: Request, @Body() reqBody: UpdateUserDto) {
  //   return await this.userService.updateUser(+req.user.id, reqBody);
  // }
}
