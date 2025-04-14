import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateSettingsDto } from '@dtos';
import { ApiMessageData } from '@types';
import { SettingErrorMessages, SuccessResponseMessages } from '@messages';
import { languages } from '@types';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from '@entities';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async getSettings(userId: number): Promise<ApiMessageData> {
    const fetchedSetting = await this.settingRepository.find({ where: { userId } });
    return { message: SuccessResponseMessages.successGeneral, data: fetchedSetting };
  }

  async updateSetting(updateSettingsDto: UpdateSettingsDto, userId: number): Promise<ApiMessageData> {
    const { settings } = updateSettingsDto;
    const settingsToBeUpdated = [];
    for (const elem of settings) {
      const { id, value, name } = elem;
      const fetchedSetting = await this.settingRepository.findOne({ where: { id, name, userId }, order: { id: 'ASC' } });
      if (!fetchedSetting) throw new NotFoundException(SettingErrorMessages.settingsNotExists);
      fetchedSetting.value = value;
      settingsToBeUpdated.push(fetchedSetting);
    }

    const updatedSettings = await this.settingRepository.save(settingsToBeUpdated);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: updatedSettings,
    };
  }
  async getLanguages(): Promise<ApiMessageData> {
    return {
      message: SuccessResponseMessages.successGeneral,
      data: languages,
    };
  }
}
