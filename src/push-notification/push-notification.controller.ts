import { Controller, Post, HttpCode, HttpStatus, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateFcmTokenUpdateDto } from './dto';
import { PushNotificationService } from './push-notification.service';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Push Notification')
@Controller('notification')
export class PushNotificationController {
  constructor(private readonly notificationService: PushNotificationService) {}

  @Post('/update-token')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update FCM Token')
  async updateFcmToken(@Req() req: Request, @Body() updateFcmTokenUpdateDto: UpdateFcmTokenUpdateDto) {
    return this.notificationService.updateFcmToken(+req.user.id, updateFcmTokenUpdateDto);
  }
}
