import { Setting } from 'src/entity';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { dataSourceOptions } from '../db-config';
import { dateFormat } from '@types';

export class SettingSeeder {
  async run(): Promise<void> {
    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const accountSettingRepository: Repository<Setting> = dataSource.getRepository(Setting);

    const settings = [
      {
        type: 'General',
        name: 'Language',
        value: 'English',
        context: 'app/web',
      },
    ];

    for (const setting of settings) {
      const existingSetting = await accountSettingRepository.findOne({
        where: { name: setting.name },
      });

      if (existingSetting) {
        existingSetting.value = setting.value;
        existingSetting.type = setting.type;
        existingSetting.context = setting.context;
        await accountSettingRepository.save(existingSetting);
      } else {
        await accountSettingRepository.save(setting);
      }
    }
  }
}
