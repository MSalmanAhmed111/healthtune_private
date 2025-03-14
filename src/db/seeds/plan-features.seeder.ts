import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { PlanFeature } from '@entities';
import { dataSourceOptions } from '../db-config';
import { ModuleEnum, PlanFeatureNameEnum } from '@types';

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
        name: PlanFeatureNameEnum.SESSION_CREATION,
        module: ModuleEnum.Session,
        defaultProperties: { isUnlimited: false, limit: 100, limitType: 'Monthly' },
      },
      {
        name: PlanFeatureNameEnum.DOCTOR_ONBOARDING,
        module: ModuleEnum.User,
        defaultProperties: { isUnlimited: true, limit: null, limitType: null },
      },
      {
        name: PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION,
        module: ModuleEnum.Templates,
        defaultProperties: {} as Record<string, any>,
      },
      {
        name: PlanFeatureNameEnum.DOCUMENT_GENERATION,
        module: ModuleEnum.Session,
        defaultProperties: { isUnlimited: false, limit: 200, limitType: 'Monthly' },
      },
      {
        name: PlanFeatureNameEnum.MACRO_REPLACEMENT,
        module: ModuleEnum.Macros,
        defaultProperties: {} as Record<string, any>,
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
      } else await planFeatureRepository.save(existingFeatures);
    } else if ((action as ActionType) === 'Update') {
      for (const feature of planFeatures) {
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
