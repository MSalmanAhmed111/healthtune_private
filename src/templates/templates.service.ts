import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Template, User, UserPlanUsage, UserPlan } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, PlanFeatureNameEnum } from '@types';
import { CreateTemplateDto, PaginationQueryDto, UpdateTemplateDto } from '@dtos';
import { TemplateErrorMessages, SuccessResponseMessages } from '@messages';
import { PlanUsageService } from 'src/common/services/plan-usage.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    private readonly planUsageService: PlanUsageService,
  ) {}

  async createTemplate(reqBody: CreateTemplateDto, language: string, userId: number): Promise<ApiMessageData> {
    const { title, prompt } = reqBody;

    // Get user with organization info and both subscription types
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'organization.userPlan', 'userPlan'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Determine which subscription to use: organization first, then individual
    // Priority: If user belongs to organization with active plan → use ORG plan
    //           If user has personal active plan → use USER plan
    //           Otherwise → no plan to track
    const belongsToOrg = user.organizationId !== null && user.organizationId !== undefined;
    const orgHasActivePlan = belongsToOrg && user.organization?.userPlan && user.organization.userPlan.isSubscriptionActive;
    const userHasActivePlan = user.userPlan && user.userPlan.isSubscriptionActive;
    
    let subscriberId: number | null = null;
    if (orgHasActivePlan) {
      subscriberId = user.organizationId;  // Use organization plan
    } else if (userHasActivePlan) {
      subscriberId = user.id;  // Use individual plan
    }

   const featureCheck = await this.planUsageService.checkUsageLimitBeforeIncrement(
      subscriberId,
      PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION,
    );
    if (!featureCheck.canUse) {
      throw new BadRequestException(
        `Feature not available in your plan. ${featureCheck.reason || 'Upgrade your plan to use this feature.'}`
      );
    }

    // Track template customization usage (after validation passes)
    try {
      await this.planUsageService.trackUsage(subscriberId, PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION, 1);
    } catch (error) {
      console.error(`Failed to track template customization usage: ${error.message}`);
      throw new BadRequestException('Failed to process template creation. Please try again.');
    }

    let template = await this.templateRepository.findOne({ where: { title } });
    if (template) throw new BadRequestException(TemplateErrorMessages.templateAlreadyExists);
    template = this.templateRepository.create({ title, prompt, language });
    await this.templateRepository.save(template);
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }

  async updateTemplate(templateId: number, reqBody: UpdateTemplateDto, language: string): Promise<ApiMessageData> {
    const { title, prompt } = reqBody;
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(TemplateErrorMessages.templateNotExists);
    if (title) {
      const template = await this.templateRepository.findOne({ where: { title, id: Not(templateId) } });
      if (template) throw new NotFoundException(TemplateErrorMessages.templateNameAlreadyExists);
    }
    template.title = title || template.title;
    template.prompt = prompt || template.prompt;
    template.language = language || template.language;
    await this.templateRepository.save(template);
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }

  async getTemplates(getTemplatesDto: PaginationQueryDto, language: string): Promise<ApiMessageDataPagination> {
    const { query, page, limit } = getTemplatesDto;
    const qb = this.templateRepository.createQueryBuilder('template');
    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(template.title) LIKE LOWER(:query)', { query: `%${query}%` }).orWhere('LOWER(template.prompt) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }
    qb.andWhere('template.language = :language', { language });
    qb.skip((page - 1) * limit).take(limit);
    const [templates, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: templates, page: page, total: total, lastPage: lastPage };
  }

  async getTemplate(templateId: number): Promise<ApiMessageData> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(TemplateErrorMessages.templateNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }

  async deleteTemplate(templateId: number, userId?: number): Promise<ApiMessageData> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(TemplateErrorMessages.templateNotExists);
    
    // Restore usage if userId provided
    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['organization', 'organization.userPlan', 'userPlan'],
      });
      if (user) {
        // Determine which subscription to use: organization first, then individual
        const belongsToOrg = user.organizationId !== null && user.organizationId !== undefined;
        const orgHasActivePlan = belongsToOrg && user.organization?.userPlan && user.organization.userPlan.isSubscriptionActive;
        const userHasActivePlan = user.userPlan && user.userPlan.isSubscriptionActive;

        let subscriberId: number | null = null;
        if (orgHasActivePlan) {
          subscriberId = user.organizationId; // Organization plan has priority
        } else if (userHasActivePlan) {
          subscriberId = user.id; // Fall back to individual plan
        }

        if (subscriberId) {
          try {
            await this.planUsageService.trackUsage(subscriberId, PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION, -1);
          } catch (error) {
            console.error(`Failed to restore template customization usage: ${error.message}`);
            // Continue - usage restoration should not block deletion
          }
        }
      }
    }
    
    await this.templateRepository.delete({ id: templateId });
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }
}
