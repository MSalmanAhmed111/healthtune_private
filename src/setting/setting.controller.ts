import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingsDto } from '@dtos';
import { SwaggerApiResponse } from '@decorators';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('/languages')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get languages')
  async getLanguages() {
    return await this.settingService.getLanguages();
  }

  @Put('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update Settings')
  async update(@Body() updatSettingDto: UpdateSettingsDto) {
    return await this.settingService.updateSetting(updatSettingDto);
  }
}
