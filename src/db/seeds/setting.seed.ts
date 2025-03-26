import { Setting } from 'src/entity';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { dataSourceOptions } from '../db-config';

export class SettingSeeder {
  async run(): Promise<void> {
    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const accountSettingRepository: Repository<Setting> = dataSource.getRepository(Setting);

    const action: string = 'create';

    const settings = [
      {
        type: 'General',
        name: 'Language',
        value: 'English',
        context: 'app/web',
      },
      {
        type: 'General',
        name: 'Enable patient records',
        value: true,
        context: 'app/web',
      },
      {
        type: 'General',
        name: 'Enable audio recording',
        value: true,
        context: 'app/web',
      },
    ];

    for (const setting of settings) {
      const existingSetting = await accountSettingRepository.findOne({
        where: { name: setting.name },
      });

      if (existingSetting) {
        if (action === 'update') {
          existingSetting.value = setting.value;
          existingSetting.type = setting.type;
          existingSetting.context = setting.context;
          await accountSettingRepository.save(existingSetting);
        } else {
          continue;
        }
      } else {
        await accountSettingRepository.save(setting);
      }
    }
    console.log('Settings seeded successfully');
  }
}
