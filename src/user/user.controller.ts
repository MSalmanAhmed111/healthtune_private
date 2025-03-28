import { Controller, Get, HttpCode, HttpStatus, Req, Body, Put, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { SwaggerApiResponse } from '@decorators';
import { SelectPlanDto, UpdateCurrentUserDto } from '@dtos';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { ValidateId } from '@pipes/validate-id.pipe';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

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

  @Put('/plan/cancel-subscription')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Cancel current user active paid subscription')
  async cancelSubscription(@Req() req: Request) {
    return await this.userService.cancelSubscription(+req.user.id);
  }

  @Put('/plan/:planId')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update current user')
  async selectPlanForUser(@Param('planId', ValidateId) planId: number, @Body() reqBody: SelectPlanDto, @Req() req: Request) {
    return await this.userService.selectPlanForUser(+req.user.id, planId, reqBody);
  }

}
