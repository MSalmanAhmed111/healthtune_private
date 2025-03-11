import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { PlanFeature } from '@entities';
import { dataSourceOptions } from '../db-config';
import { ModuleEnum } from '@types';

export class PlanFeatureSeeder {
  async run(): Promise<void> {
    enum ActionType {
      Update = 'Update',
      Create = 'Create',
    }

    const action: ActionType = ActionType.Create;

    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const planFeatureRepository: Repository<PlanFeature> = dataSource.getRepository(PlanFeature);

    const planFeatures = [
      {
        name: 'Session Creation',
        module: ModuleEnum.Session,
        defaultProperties: { isUnlimited: false, limit: 100, limitType: 'Monthly' },
      },
      {
        name: 'Doctor Onboarding',
        module: ModuleEnum.User,
        defaultProperties: { isEnabled: true, isUnlimited: true, limit: null, limitType: null },
      },
      {
        name: 'Template Customization',
        module: ModuleEnum.Templates,
        defaultProperties: { isEnabled: true, isUnlimited: true, limit: null, limitType: null },
      },
      {
        name: 'Document Generation',
        module: ModuleEnum.Session,
        defaultProperties: { isEnabled: true, isUnlimited: true, limit: null, limitType: null },
      },
      {
        name: 'Macros & Replace',
        module: ModuleEnum.Macros,
        defaultProperties: { isEnabled: true, isUnlimited: true, limit: null, limitType: true },
      },
    ];

    for (const feature of planFeatures) {
      const existingFeature = await planFeatureRepository.findOne({ where: { name: feature.name } });

      if ((action as ActionType) === ActionType.Create && !existingFeature) {
        await planFeatureRepository.save(feature);
      } else if ((action as ActionType) === ActionType.Update && existingFeature) {
        await planFeatureRepository.update(existingFeature.id, feature);
      }
    }

    if ((action as ActionType) === ActionType.Create) {
      const existingFeatures = await planFeatureRepository.find();
      if (existingFeatures.length > 0) {
        console.log('Features already seeded.');
        return;
      } else await planFeatureRepository.save(features);
    } else if ((action as ActionType) === 'Update') {
      for (const feature of features) {
        const existingFeatures = await planFeatureRepository.findOne({ where: { name: feature.name } });
        if (existingFeatures) {
          existingFeatures.module = feature.module;
          existingFeatures.defaultProperties = feature.defaultProperties;
          await planFeatureRepository.save(existingFeatures);
        } else await planFeatureRepository.save(feature);
      }
    } else {
      console.log('Invalid action. Choose either "Create" or "Update".');
    }

    console.log('Features seeded successfully.');
  }
}
