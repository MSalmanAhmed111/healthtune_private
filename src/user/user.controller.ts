import { Controller, Get, HttpCode, HttpStatus, Req, Body, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { SwaggerApiResponse } from '@decorators';
import { UpdateCurrentUserDto } from '@dtos';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
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

}
