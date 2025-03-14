import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { Plan, PlanFeature, PlanFeatureProperty } from '@entities';
import { dataSourceOptions } from '../db-config';
import { PlanTypeEnum, PlanFeatureNameEnum, FeatureLimitTypeEnum } from '@types';

export class PlanSeeder {
  async run(): Promise<void> {
    enum ActionType {
      Update = 'Update',
      Create = 'Create',
    }

    const action: ActionType = ActionType.Create;

    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const planRepository: Repository<Plan> = dataSource.getRepository(Plan);
    const planFeatureRepository: Repository<PlanFeature> = dataSource.getRepository(PlanFeature);

    const sessionCreationPlanFeatures = await planFeatureRepository.findOne({ where: { name: PlanFeatureNameEnum.SESSION_CREATION } });
    const documentGenerationPlanFeatures = await planFeatureRepository.findOne({ where: { name: PlanFeatureNameEnum.DOCUMENT_GENERATION } });
    const templateCustomizationPlanFeatures = await planFeatureRepository.findOne({ where: { name: PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION } });
    const macroReplacementPlanFeatures = await planFeatureRepository.findOne({ where: { name: PlanFeatureNameEnum.MACRO_REPLACEMENT } });

    if (!sessionCreationPlanFeatures) {
      console.log('Session Creation feature for plan not found. Plan seeding failed.');
      return;
    }
    if (!documentGenerationPlanFeatures) {
      console.log('Document Generation feature for plan not found. Plan seeding failed.');
      return;
    }
    if (!templateCustomizationPlanFeatures) {
      console.log('Template Customization feature for plan not found. Plan seeding failed.');
      return;
    }
    if (!macroReplacementPlanFeatures) {
      console.log('Macro Replacement feature for plan not found. Plan seeding failed.');
      return;
    }

    const plans = [
      {
        name: 'Basic Plan',
        description: 'A free plan for therapists and healthcare professionals testing the service.',
        price: '0',
        planType: PlanTypeEnum.MONTHLY,
        features: [
          {
            displayName: '5 Sessions Per Month',
            properties: { isUnlimited: false, limit: 5, limitType: FeatureLimitTypeEnum.MONTHLY },
            feature: sessionCreationPlanFeatures,
          },
        ],
      },
      {
        name: 'Premium Plan',
        description: 'Make the best schedule for your team.',
        price: '25',
        planType: PlanTypeEnum.MONTHLY,
        features: [
          {
            displayName: '50 Sessions Per Month',
            properties: { isUnlimited: false, limit: 50, limitType: FeatureLimitTypeEnum.MONTHLY },
            feature: sessionCreationPlanFeatures,
          },

          {
            displayName: 'AI Document Generation',
            properties: {},
            feature: documentGenerationPlanFeatures,
          },
          {
            displayName: 'Customizable Templates',
            properties: {},
            feature: templateCustomizationPlanFeatures,
          },
          {
            displayName: 'Macros & Replace Forever',
            properties: {},
            feature: macroReplacementPlanFeatures,
          },
        ],
      },
      {
        name: 'Enterprise Plan',
        description: 'Unlock all advanced features and get a discount for organizations with 5+ users.',
        price: '49',
        planType: PlanTypeEnum.MONTHLY,
        features: [
          {
            displayName: 'Unlimited Sessions',
            properties: { isUnlimited: true, limit: null, limitType: null },
            feature: sessionCreationPlanFeatures,
          },
          {
            displayName: 'AI Document Generation',
            properties: {},
            feature: documentGenerationPlanFeatures,
          },
          {
            displayName: 'Customizable Templates',
            properties: { isUnlimited: true, limit: null, limitType: null },
            feature: templateCustomizationPlanFeatures,
          },
          {
            displayName: 'Macros & Replace Forever',
            properties: {},
            feature: macroReplacementPlanFeatures,
          },
        ],
      },
    ];

    for (const planData of plans) {
      let plan = await planRepository.findOne({ where: { name: planData.name } });

      if ((action as ActionType) === ActionType.Create && !plan) {
        plan = await planRepository.save({
          ...planData,
          name: planData.name,
          description: planData.description,
          price: planData.price,
          planType: planData.planType,
        });
      } else if ((action as ActionType) === ActionType.Update && plan) {
        await planRepository.update(plan.id, planData);
      }
    }

    console.log('Plans seeded successfully.');
  }
}
