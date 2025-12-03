import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData, PermissionEnum } from '@types';
import { CreateTemplateDto, PaginationQueryDto, UpdateTemplateDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Templates')
@Controller('template')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('/')
  @Permissions(PermissionEnum.MANAGE_CUSTOMIZATIONS)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new template')
  async createTemplate(@Body() reqBody: CreateTemplateDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.templatesService.createTemplate(reqBody, req.headers['accept-language'], +req.user.id);
  }

  @Put('/:id')
  @Permissions(PermissionEnum.MANAGE_CUSTOMIZATIONS)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update template')
  async updateTemplate(@Param('id', ValidateId) templateId: number, @Body() reqBody: UpdateTemplateDto, @Req() req: Request) {
    return await this.templatesService.updateTemplate(templateId, reqBody, req.headers['accept-language']);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all templates')
  async getTemplates(@Query() queryParams: PaginationQueryDto, @Req() req: Request) {
    return await this.templatesService.getTemplates(queryParams, req.headers['accept-language']);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a template by ID')
  async getTemplate(@Param('id', ValidateId) templateId: number) {
    return await this.templatesService.getTemplate(templateId);
  }

  @Delete('/:id')
  @Permissions(PermissionEnum.MANAGE_CUSTOMIZATIONS)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a template by ID')
  async deleteTemplate(@Param('id', ValidateId) templateId: number, @Req() req: Request) {
    return await this.templatesService.deleteTemplate(templateId, +req.user.id);
  }
}
