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

    // Get user with organization info
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Get org ID for usage tracking
    const orgId = user.organizationId;

    // Track template customization usage
    try {
      await this.planUsageService.trackUsage(orgId, PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION, 1);
    } catch (error) {
      console.error(`Failed to track template customization usage: ${error.message}`);
      // Continue - usage tracking should not block template creation
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
        relations: ['organization'],
      });
      if (user) {
        const orgId = user.organizationId;
        try {
          await this.planUsageService.trackUsage(orgId, PlanFeatureNameEnum.TEMPLATE_CUSTOMIZATION, -1);
        } catch (error) {
          console.error(`Failed to restore template customization usage: ${error.message}`);
          // Continue - usage restoration should not block deletion
        }
      }
    }
    
    await this.templateRepository.delete({ id: templateId });
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }
}
