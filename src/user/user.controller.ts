import { Controller, Get, HttpCode, HttpStatus, Req, Body, Put, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { SwaggerApiResponse } from '@decorators';
import { RedirectionUrlDto, UpdateCurrentUserDto } from '@dtos';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { ValidateId } from '@pipes/validate-id.pipe';
import { ApiMessageData } from '@types';

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
  async selectPlanForUser(@Param('planId', ValidateId) planId: number, @Body() reqBody: RedirectionUrlDto, @Req() req: Request) {
    return await this.userService.selectPlanForUser(+req.user.id, planId, reqBody);
  }

  @Get("/card")
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get current user card details')
  async getUserCardDetails(@Req() req: Request): Promise<ApiMessageData> {
    return await this.userService.getUserCardDetails(+req.user.id);
  }

  @Put("/card")
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update current user card details')
  async addUpdateCard(@Req() req: Request, @Body() reqBody: RedirectionUrlDto): Promise<ApiMessageData> {
    return await this.userService.addUpdateCard(+req.user.id, reqBody);
  }

}
