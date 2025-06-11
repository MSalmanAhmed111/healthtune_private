import { Controller, Post, Body, Req, HttpCode, HttpStatus, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { GeneratePushNotificationDto, UpdateFcmTokenUpdateDto } from '@dtos';
import { Request } from 'express';
import { SuccessResponseMessages } from '@messages';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessPermissions, ApiMessageData } from '@types';
import { Permissions } from '@decorators';
import { GetQueryNotificationDto } from './dto/get-notification.dto';

@ApiTags('Notification')
@Controller('notification')
export class PushNotificationController {
  constructor(private readonly notificationService: PushNotificationService) {}

  @Post('/')
  @Permissions(AccessPermissions.CreatePushNotification)
  @HttpCode(HttpStatus.OK)
  async createPushNotification(@Body() generatePushNotificationDto: GeneratePushNotificationDto) {
    return this.notificationService.createPushNotification(generatePushNotificationDto);
  }

  @Post('/update-token')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: SuccessResponseMessages.successGeneral })
  async updateFcmToken(@Req() req: Request, @Body() updateFcmTokenUpdateDto: UpdateFcmTokenUpdateDto) {
    return this.notificationService.updateFcmToken(+req.user.id, updateFcmTokenUpdateDto);
  }

  @Post('/read/:id')
  @Permissions(AccessPermissions.UpdateNotification)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: SuccessResponseMessages.successGeneral })
  async readNotification(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationService.readNotification(id);
  }
  @Get('/user')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: SuccessResponseMessages.successGeneral })
  @Permissions(AccessPermissions.ReadNotification)
  async getUserNotifications(@Req() req: Request, @Query() getQueryNotificationDto: GetQueryNotificationDto): Promise<ApiMessageData> {
    return this.notificationService.getUserNotifications(+req.user.id, getQueryNotificationDto);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: SuccessResponseMessages.successGeneral })
  @Permissions(AccessPermissions.ReadNotification)
  async getAdminNotifications(@Req() req: Request, @Query() getQueryNotificationDto: GetQueryNotificationDto) {
    return this.notificationService.getAdminNotifications(+req.user.id, getQueryNotificationDto);
  }
}
