import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { EDocumentService } from './e-forms.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { UpsertDocumentDto, UpsertDocumentIssuanceDto } from 'src/dto';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('E-Documents')
@Controller('e-document')
export class EDocumentController {
  constructor(private readonly edocumentService: EDocumentService) { }

  @Post('/upsert')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Upsert an e-document')
  async getEDocumentStats(@Body() reqBody: UpsertDocumentDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.upsertDocument(reqBody, +req.user.id);
  }

  @Post('/issue')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Issue an e-document')
  async createEDocument(@Body() reqBody: UpsertDocumentIssuanceDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.edocumentService.issueDocument(reqBody, +req.user.id);
  }

}
