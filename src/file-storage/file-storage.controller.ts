import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UploadedFile, Put, ParseIntPipe, Query, Delete } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { UploadFileStorageDto, GetFileStorageDto, UpdateFileStorageDto } from '@dtos';
import { ApiResponse } from '@nestjs/swagger';
import { SuccessResponseMessages } from '@messages';
import { FileUpload, SwaggerApiResponse } from '@decorators';

@Controller('/upload')
export class FileStorageController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @FileUpload('file')
  @SwaggerApiResponse('Upload new file')
  async uploadFileStorage(@Body() uploadFileStorageDto: UploadFileStorageDto, @UploadedFile() file: Express.Multer.File) {
    return await this.fileStorageService.uploadFileStorage(uploadFileStorageDto, file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all files from storage')
  async getFilesStorage(@Query() getFileStorageDto: GetFileStorageDto) {
    return await this.fileStorageService.getFilesStorage(getFileStorageDto);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get file from storage')
  async getFileStorage(@Param('id', ParseIntPipe) id: number) {
    return await this.fileStorageService.getFileStorage(id);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @FileUpload('file')
  @SwaggerApiResponse('Update file in storage')
  async updateFileStorage(@Param('id', ParseIntPipe) id: number, @Body() updateFileStorageDto: UpdateFileStorageDto, @UploadedFile() file: Express.Multer.File) {
    return await this.fileStorageService.updateFileStorage(id, updateFileStorageDto, file);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete file from storage')
  async deleteFileStorage(@Param('id', ParseIntPipe) id: number) {
    return await this.fileStorageService.deleteFileStorage(id);
  }
}
