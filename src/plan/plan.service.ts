import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, PlanFeatureProperty, PlanFeature } from '@entities';
import { Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreatePlanDto, PaginationQueryDto, UpdatePlanDto } from 'src/dto';
import { PlanErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan) private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanFeature) private readonly featureRepository: Repository<PlanFeature>,
    @InjectRepository(PlanFeatureProperty) private readonly featurePropertyRepository: Repository<PlanFeatureProperty>,
  ) {}

  async createPlan(reqBody: CreatePlanDto): Promise<ApiMessageData> {
    const { name, description, price, planType, features } = reqBody;

    let plan = await this.planRepository.findOne({ where: { name } });
    if (plan) throw new BadRequestException(PlanErrorMessages.planAlreadyExists);

    plan = this.planRepository.create({ name, description, price, planType, features: [] });
    await this.planRepository.save(plan);

    if (features && features.length > 0) {
      for (const featureProp of features) {
        const feature = await this.featureRepository.findOne({ where: { id: featureProp.featureId } });
        if (!feature) throw new BadRequestException(`Feature for ${featureProp.displayName} not found`);

        let planFeatureProperty = this.featurePropertyRepository.create({
          plan,
          feature,
          displayName: featureProp.displayName,
          description: featureProp.description,
          featureId: featureProp.featureId,
          properties: featureProp.properties,
        });

        planFeatureProperty = await this.featurePropertyRepository.save(planFeatureProperty);
        planFeatureProperty.plan = undefined;
        plan.features.push(planFeatureProperty);
      }
    }

    return { message: SuccessResponseMessages.successGeneral, data: plan };
  }

  async updatePlan(planId: number, reqBody: UpdatePlanDto): Promise<ApiMessageData> {
    const { name, price, planType, features } = reqBody;

    let plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);

    if (name) {
      const existingPlan = await this.planRepository.findOne({ where: { name } });
      if (existingPlan && existingPlan.id !== planId) throw new BadRequestException(PlanErrorMessages.planNameAlreadyExists);
    }

    plan.name = name || plan.name;
    plan.price = price || plan.price;
    plan.planType = planType || plan.planType;
    plan = await this.planRepository.save(plan);
    plan.features = [];

    if (features && features.length > 0) {
      for (const featureProp of features) {
        let planFeatureProperty = await this.featurePropertyRepository.findOne({
          where: { plan: { id: planId }, feature: { id: featureProp.featureId } },
        });

        if (planFeatureProperty) {
          planFeatureProperty.properties = featureProp.properties;
        } else {
          const feature = await this.featureRepository.findOne({ where: { id: featureProp.featureId } });
          if (!feature) throw new BadRequestException(`Feature with ID ${featureProp.featureId} not found`);

          planFeatureProperty = this.featurePropertyRepository.create({
            plan,
            feature,
            displayName: featureProp.displayName,
            description: featureProp.description,
            featureId: featureProp.featureId,
            properties: featureProp.properties,
          });
        }

        planFeatureProperty = await this.featurePropertyRepository.save(planFeatureProperty);
        planFeatureProperty.plan = undefined;
        plan.features.push(planFeatureProperty);
      }
    }

    return { message: SuccessResponseMessages.successGeneral, data: plan };
  }

  async getPlan(planId: number): Promise<ApiMessageData> {
    const plan = await this.planRepository.findOne({ where: { id: planId }, relations: ['features', 'features.feature'] });
    if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: plan };
  }

  async getPlans(reqQuery: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    const { page, limit, sort = 'DESC' } = reqQuery;

    const [plans, total] = await this.planRepository.findAndCount({
      relations: ['features', 'features.feature'],
      take: limit,
      skip: (page - 1) * limit,
      order: { id: sort },
    });

    return { message: SuccessResponseMessages.successGeneral, data: plans, page, lastPage: Math.ceil(total / limit), total };
  }
}
