import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import {nanoid} from 'nanoid';

import { StorageProviderInterface } from './storage-provider.interface';
import * as process from 'process';
import { ErrorResponseMessages } from '@messages';

@Injectable()
export class LocalStorageProvider implements StorageProviderInterface {
  private readonly path: string = process.env.STORAGE_PATH;

  constructor() {}

  uploadFile(file: Express.Multer.File): string {
    const mimeType = file.mimetype.split('/');
    const fileName = `${nanoid()}.` + mimeType[1];
    fs.writeFileSync(this.path + '/' + fileName, file.buffer, 'utf8');
    return fileName;
  }

  uploadFiles(files: Express.Multer.File[]): string[] {
    const uploadedFiles = [];
    files.forEach((file) => {
      const mimeType = file.mimetype.split('/');
      const fileName = `${nanoid()}.` + mimeType[1];
      fs.writeFileSync(this.path + '/' + fileName, file.buffer, 'utf8');
      uploadedFiles.push(fileName);
    });
    return uploadedFiles;
  }

  deleteFile(fileName: string): void {
    fs.existsSync(this.path + '/' + fileName) && fs.unlinkSync(this.path + '/' + fileName);
    // console.log(this.path + '/' + fileName);
    // const fileExists = fs.existsSync(this.path + '/' + fileName);
    // if (fileExists) fs.unlinkSync(this.path + '/' + fileName);
    // else throw new BadRequestException(ErrorResponseMessages.fileStorageNotExists);
  }

  deleteFiles(fileNames: string[]): void {
    fileNames.forEach((name) => {
      fs.existsSync(this.path + '/' + name) && fs.unlinkSync(this.path + '/' + name);
    });
  }
}
