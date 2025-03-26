import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { Plan, PlanFeature, PlanFeatureProperty } from '@entities';
import { dataSourceOptions } from '../db-config';
import { PlanTypeEnum, PlanFeatureNameEnum, FeatureLimitTypeEnum, SeedPlanNamesEnum } from '@types';
import { StripeHelper } from '@helpers/stripe.helper';
import { ConfigService } from '@nestjs/config';

export class PlanSeeder {
  private stripeHelper: StripeHelper;
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
    this.stripeHelper = new StripeHelper(this.configService);
  }

  async run(): Promise<void> {
    enum ActionType {
      Update = 'Update',
      Create = 'Create',
    }

    const action: ActionType = ActionType.Update;

    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const planRepository: Repository<Plan> = dataSource.getRepository(Plan);
    const planFeatureRepository: Repository<PlanFeature> = dataSource.getRepository(PlanFeature);
    const planFeaturePropertyRepository: Repository<PlanFeatureProperty> = dataSource.getRepository(PlanFeatureProperty);

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

    const plans: any = [
      {
        name: SeedPlanNamesEnum.BASIC_PLAN,
        description: 'A free plan for therapists and healthcare professionals testing the service.',
        price: '0',
        planType: PlanTypeEnum.MONTHLY,
        stripeProductId: null,
        stripePriceId: null,
        features: [
          {
            displayName: '5 Sessions Per Month',
            properties: { isUnlimited: false, limit: 5, limitType: FeatureLimitTypeEnum.MONTHLY },
            feature: sessionCreationPlanFeatures,
          },
        ],
      },
      {
        name: SeedPlanNamesEnum.PREMIUM_PLAN,
        description: 'Make the best schedule for your team.',
        price: '25',
        planType: PlanTypeEnum.MONTHLY,
        stripeProductId: null,
        stripePriceId: null,
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
        name: SeedPlanNamesEnum.ENTERPRISE_PLAN,
        description: 'Unlock all advanced features and get a discount for organizations with 5+ users.',
        price: '49',
        planType: PlanTypeEnum.MONTHLY,
        stripeProductId: null,
        stripePriceId: null,
        features: [
          {
            displayName: 'Unlimited Sessions',
            properties: { isUnlimited: true, limit: null, limitType: null },
            feature: sessionCreationPlanFeatures,
            description: null,
          },
          {
            displayName: 'AI Document Generation',
            properties: {},
            feature: documentGenerationPlanFeatures,
            description: null,
          },
          {
            displayName: 'Customizable Templates',
            properties: { isUnlimited: true, limit: null, limitType: null },
            feature: templateCustomizationPlanFeatures,
            description: null,
          },
          {
            displayName: 'Macros & Replace Forever',
            properties: {},
            feature: macroReplacementPlanFeatures,
            description: null,
          },
        ],
      },
    ];

    for (const planData of plans) {
      let plan = await planRepository.findOne({ where: { name: planData.name } });
      const { name, description, price, planType } = plan;
      if ((action as ActionType) === ActionType.Create && !plan) {
        if (!plan) {
          const stripeProduct = await this.stripeHelper.createProduct(name, description);
          const stripePrice = await this.stripeHelper.createProductPrice(stripeProduct.id, +price, planType);
          plan.stripeProductId = stripeProduct.id;
          plan.stripePriceId = stripePrice.id;
          plan = await planRepository.save(plan);
        }
        continue;
      } else if ((action as ActionType) === ActionType.Update && plan) {
        const stripeProductId = plan.stripeProductId || null,
          stripePriceId = plan.stripePriceId || null;
        if (!stripeProductId) {
          const newStripeProduct = await this.stripeHelper.createProduct(name, description);
          planData.stripeProductId = newStripeProduct.id;
        }
        if (!stripePriceId) {
          const newStripePrice = await this.stripeHelper.createProductPrice(planData.stripeProductId, +price, planType);
          planData.stripePriceId = newStripePrice.id;
        }
        for (let i = 0; i < planData.features.length; i++) {
          const feature = planData.features[i];

          const existingFeature = await planFeaturePropertyRepository.findOne({
            where: { plan: { id: plan.id }, feature: { name: feature.feature.name } },
          });

          console.log({ existingFeature });

          if (existingFeature) {
            planData.features[i] = { ...existingFeature, ...feature };
          }
        }
        await planRepository.save({ id: plan.id, ...planData });
      }
    }

    console.log('Plans seeded successfully.');
  }
}
