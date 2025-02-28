import { Injectable } from '@nestjs/common';
import { StorageProviderInterface } from './storage-provider.interface';
import * as AWS from 'aws-sdk';

import {nanoid} from 'nanoid';

@Injectable()
export class AwsStorageProvider implements StorageProviderInterface {
  private readonly s3BucketName: string = process.env.STORAGE_S3_BUCKET_NAME;
  private readonly s3: AWS.S3 = new AWS.S3({
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    },
  });

  constructor() {}

  private async s3Upload(file: any, bucket: string, name: string, mimetype: string): Promise<AWS.S3.ManagedUpload.SendData> {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };
    try {
      return await this.s3.upload(params).promise();
    } catch (e) {
      console.log(e);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.s3.deleteObject({ Bucket: this.s3BucketName, Key: fileName }).promise();
  }

  async deleteFiles(fileNames: string[]): Promise<void> {
    const objects = fileNames.map((key) => ({ Key: key }));
    await this.s3.deleteObjects({ Bucket: this.s3BucketName, Delete: { Objects: objects } }).promise();
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype.split('/')[1];
    const fileName = nanoid();
    const uploadedFile = await this.s3Upload(file.buffer, this.s3BucketName, fileName, mimeType);
    return uploadedFile.Key;
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
    let uploadedFiles = [];
    for (const file of files) {
      const mimeType = file.mimetype.split('/')[1];
      const fileName = nanoid();
      await this.s3Upload(file.buffer, this.s3BucketName, fileName, mimeType);
      uploadedFiles.push(fileName);
    }
    return uploadedFiles;
  }
}
