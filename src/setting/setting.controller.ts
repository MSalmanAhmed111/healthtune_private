import { Controller, Get, Body, HttpCode, HttpStatus, Put, Req } from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingsDto } from '@dtos';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('/languages')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get languages')
  async getLanguages() {
    return await this.settingService.getLanguages();
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get Settings')
  async getSettings(@Req() req: Request) {
    return await this.settingService.getSettings(+req.user.id);
  }

  @Put('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update Settings')
  async update(@Body() updatSettingDto: UpdateSettingsDto, @Req() req: Request) {
    return await this.settingService.updateSetting(updatSettingDto, +req.user.id);
  }
}
