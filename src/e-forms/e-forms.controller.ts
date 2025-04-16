import { Controller, Post, Body, HttpCode, HttpStatus, Req, Param, Get, Query } from '@nestjs/common';
import { EDocumentService } from './e-forms.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { GetAllIssuedDocumentsDto, PaginationQueryDto, UpsertDocumentDto, UpsertDocumentIssuanceDto } from 'src/dto';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';
import { ValidateId } from '@pipes/validate-id.pipe';

@ApiTags('E-Documents')
@Controller('e-document')
export class EDocumentController {
  constructor(private readonly edocumentService: EDocumentService) {}

  @Post('/upsert')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Upsert an e-document')
  async getEDocumentStats(@Body() reqBody: UpsertDocumentDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.upsertDocument(reqBody, +req.user.id);
  }

  @Get('/upsert/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get an upserted e-document by ID')
  async getUpsertedDocument(@Param('id', ValidateId) id: number, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.getUpsertedDocument(id, +req.user.id);
  }

  @Get('/upsert')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all upserted e-document')
  async getAllUpsertedDocuments(@Query() reqQuery: PaginationQueryDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.getAllUpsertedDocuments(reqQuery, +req.user.id);
  }

  @Post('/issue')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Issue an e-document')
  async createEDocument(@Body() reqBody: UpsertDocumentIssuanceDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.issueDocument(reqBody, +req.user.id);
  }

  @Get('/issued/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get an issued e-document by ID')
  async getIssuedDocument(@Param('id', ValidateId) id: number, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.getIssuedDocument(id, +req.user.id);
  }

  @Get('/issued')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all issued e-document')
  async getAllIssuedDocuments(@Query() reqQuery: GetAllIssuedDocumentsDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.getAllIssuedDocuments(reqQuery, +req.user.id);
  }
}
