/* eslint-disable @typescript-eslint/no-unused-vars */
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { fileMimetypeFilter } from '@filters/index';

export function FileUpload(fieldName: string = 'file', required: boolean = false, localOptions?: MulterOptions) {
  return applyDecorators(UseInterceptors(FileInterceptor(fieldName, localOptions)));
}

export function MultipleFilesUpload(fieldName: string = 'files', maxCount: number, required: boolean = false, localOptions?: MulterOptions) {
  return applyDecorators(UseInterceptors(FilesInterceptor(fieldName, maxCount, localOptions)));
}

export function AttachmentUpload(fileName: string = 'image', required: boolean = false) {
  return FileUpload(fileName, required, {
    fileFilter: fileMimetypeFilter('png', 'jpg', 'jpeg', 'pdf', 'xlsx', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'csv'),
  });
}

export function AttachmentsUpload(fieldName: string = 'attachments', maxCount: number, required: boolean = false) {
  return MultipleFilesUpload(fieldName, maxCount, required, {
    fileFilter: fileMimetypeFilter('png', 'jpg', 'jpeg', 'pdf', 'xlsx', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'csv'),
  });
}

export function ImageUpload(fileName: string = 'image', required: boolean = false) {
  return FileUpload(fileName, required, {
    fileFilter: fileMimetypeFilter('png', 'jpg', 'jpeg'),
  });
}

export function ImagesUpload(fieldName: string = 'images', maxCount: number, required: boolean = false) {
  return MultipleFilesUpload(fieldName, maxCount, required, {
    fileFilter: fileMimetypeFilter('png', 'jpg', 'jpeg'),
  });
}
