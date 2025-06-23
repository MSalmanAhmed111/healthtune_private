import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req, UploadedFile } from '@nestjs/common';
import { QuickNotessService } from './quick-notes.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreateQuickNotesDto, PaginationQueryDto, UpdateQuickNotesDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { FileUpload, SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Quick Notes')
@Controller('quick-notes')
export class QuickNotessController {
  constructor(private readonly quickNotesService: QuickNotessService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new quick note')
  @FileUpload('file')
  async createQuickNotes(@Body() reqBody: CreateQuickNotesDto, @Req() req: Request, @UploadedFile() file: Express.Multer.File): Promise<ApiMessageData> {
    return await this.quickNotesService.createQuickNote(+req.user.id, reqBody, file);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update quick note')
  @FileUpload('file')
  async updateQuickNotes(@Param('id', ValidateId) quickNoteId: number, @Body() reqBody: UpdateQuickNotesDto, @UploadedFile() file: Express.Multer.File) {
    return await this.quickNotesService.updateQuickNote(quickNoteId, reqBody, file);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all quick notes')
  async getQuickNotess(@Query() queryParams: PaginationQueryDto) {
    return await this.quickNotesService.getQuickNotes(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a quick note by ID')
  async getQuickNotes(@Param('id', ValidateId) quickNoteId: number) {
    return await this.quickNotesService.getQuickNote(quickNoteId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a quick note by ID')
  async deleteQuickNotess(@Param('id', ValidateId) quickNoteId: number) {
    return await this.quickNotesService.deleteQuickNotes(quickNoteId);
  }
}
