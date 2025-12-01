import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Template, User, UserPlanUsage } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, PlanFeatureNameEnum } from '@types';
import { CreateTemplateDto, PaginationQueryDto, UpdateTemplateDto } from '@dtos';
import { TemplateErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
  ) {}

  async createTemplate(reqBody: CreateTemplateDto, language: string, userId: number): Promise<ApiMessageData> {
    const { title, prompt } = reqBody;

    // Get user with subscription info
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userPlan', 
        'userPlan.usage', 
        'userPlan.usage.planFeatureProperty', 
        'userPlan.usage.planFeatureProperty.feature',
        'organization',
        'organization.userPlan',
        'organization.userPlan.usage',
        'organization.userPlan.usage.planFeatureProperty',
        'organization.userPlan.usage.planFeatureProperty.feature'
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    // Check template customization usage before creating template
    const effectiveSubscription = user.userPlan || user.organization?.userPlan;
    if (effectiveSubscription) {
      const usage = effectiveSubscription.usage.find((u) => u.planFeatureProperty.feature.name == PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION);
      if (!usage) {
        throw new BadRequestException('Template customization is not available in your current plan');
      }
      if (usage.usageCount <= 0) throw new BadRequestException('No template customization credits left');
      usage.usageCount = usage.usageCount - 1;
      await this.userPlanUsageRepository.save(usage);
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

  async deleteTemplate(templateId: number): Promise<ApiMessageData> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(TemplateErrorMessages.templateNotExists);
    await this.templateRepository.delete({ id: templateId });
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }
}
