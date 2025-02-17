import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Template } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreateTemplateDto, PaginationQueryDto, UpdateTemplateDto } from '@dtos';
import { TemplateErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async createTemplate(reqBody: CreateTemplateDto): Promise<ApiMessageData> {
    const { title, prompt } = reqBody;
    let template = await this.templateRepository.findOne({ where: { title } });
    if (template) throw new BadRequestException(TemplateErrorMessages.templateAlreadyExists);
    template = this.templateRepository.create({ title, prompt });
    await this.templateRepository.save(template);
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }

  async updateTemplate(templateId: number, reqBody: UpdateTemplateDto): Promise<ApiMessageData> {
    const { title, prompt } = reqBody;
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException(TemplateErrorMessages.templateNotExists);
    if (title) {
      const template = await this.templateRepository.findOne({ where: { title, id: Not(templateId) } });
      if (template) throw new NotFoundException(TemplateErrorMessages.templateNameAlreadyExists);
    }
    template.title = title || template.title;
    template.prompt = prompt || template.prompt;
    await this.templateRepository.save(template);
    return { message: SuccessResponseMessages.successGeneral, data: template };
  }

  async getTemplates(getTemplatesDto: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    const { query, page, limit } = getTemplatesDto;
    const qb = this.templateRepository.createQueryBuilder('template');
    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(template.title) LIKE LOWER(:query)', { query: `%${query}%` }).orWhere('LOWER(template.prompt) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }
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
}
