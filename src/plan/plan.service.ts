import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan, PlanFeatureProperty, PlanFeature } from '@entities';
import { Repository } from 'typeorm';
import { ApiMessageData } from '@types';
import { CreatePlanDto, UpdatePlanDto } from 'src/dto';
import { PlanErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private readonly planRepository: Repository<Plan>,
    @InjectRepository(PlanFeature) private readonly featureRepository: Repository<PlanFeature>,
    @InjectRepository(PlanFeatureProperty) private readonly featurePropertyRepository: Repository<PlanFeatureProperty>,
  ) {}

  async createPlan(reqBody: CreatePlanDto): Promise<ApiMessageData> {
    const { name, price, planType, featureProperties } = reqBody;

    let plan = await this.planRepository.findOne({ where: { name } });
    if (plan) throw new BadRequestException(PlanErrorMessages.planAlreadyExists);

    plan = this.planRepository.create({ name, price, planType });
    await this.planRepository.save(plan);

    if (featureProperties && featureProperties.length > 0) {
      for (const featureProp of featureProperties) {
        const feature = await this.featureRepository.findOne({ where: { id: featureProp.featureId } });
        if (!feature) throw new BadRequestException(`Feature with ID ${featureProp.featureId} not found`);

        const planFeatureProperty = this.featurePropertyRepository.create({
          plan,
          feature,
          properties: featureProp.properties,
        });

        await this.featurePropertyRepository.save(planFeatureProperty);
      }
    }

    return { message: SuccessResponseMessages.successGeneral, data: plan };
  }

  async updatePlan(planId: number, reqBody: UpdatePlanDto): Promise<ApiMessageData> {
    const { name, price, planType, featureProperties } = reqBody;

    // Check if plan exists
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);

    // Check for duplicate name
    if (name) {
      const existingPlan = await this.planRepository.findOne({ where: { name } });
      if (existingPlan && existingPlan.id !== planId) throw new BadRequestException(PlanErrorMessages.planNameAlreadyExists);
    }

    // Update plan fields
    plan.name = name || plan.name;
    plan.price = price || plan.price;
    plan.planType = planType || plan.planType;
    await this.planRepository.save(plan);

    // Update feature properties dynamically
    if (featureProperties && featureProperties.length > 0) {
      for (const featureProp of featureProperties) {
        let planFeatureProperty = await this.featurePropertyRepository.findOne({
          where: { plan: { id: planId }, feature: { id: featureProp.featureId } },
        });

        if (planFeatureProperty) {
          // Update existing feature properties
          planFeatureProperty.properties = featureProp.properties;
        } else {
          // Create new feature property if it doesn't exist
          const feature = await this.featureRepository.findOne({ where: { id: featureProp.featureId } });
          if (!feature) throw new BadRequestException(`Feature with ID ${featureProp.featureId} not found`);

          planFeatureProperty = this.featurePropertyRepository.create({
            plan,
            feature,
            properties: featureProp.properties,
          });
        }

        await this.featurePropertyRepository.save(planFeatureProperty);
      }
    }

    return { message: SuccessResponseMessages.successGeneral, data: plan };
  }
}
