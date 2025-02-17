import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreateTemplateDto, PaginationQueryDto, UpdateTemplateDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('Templates')
@Controller('template')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new template')
  async createTemplate(@Body() reqBody: CreateTemplateDto): Promise<ApiMessageData> {
    return await this.templatesService.createTemplate(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update template')
  async updateTemplate(@Param('id', ValidateId) templateId: number, @Body() reqBody: UpdateTemplateDto) {
    return await this.templatesService.updateTemplate(templateId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all templates')
  async getTemplates(@Query() queryParams: PaginationQueryDto) {
    return await this.templatesService.getTemplates(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a template by ID')
  async getTemplate(@Param('id', ValidateId) templateId: number) {
    return await this.templatesService.getTemplate(templateId);
  }
}
