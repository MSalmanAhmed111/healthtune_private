import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UploadFileStorageDto, UpdateFileStorageDto, GetFileStorageDto } from '@dtos';
import { FileStorage } from '@entities';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorResponseMessages, FileStorageErrorMessages, SuccessResponseMessages } from '@messages';
import { StorageProviderInterface } from 'src/common/providers';
import { ApiMessageData, ApiMessageDataPagination } from '@types';

@Injectable()
export class FileStorageService {
  private readonly path: string = process.env.STORAGE_PATH;
  constructor(
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,

    @Inject('StorageProvider')
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  async uploadFileStorage(uploadFileStorageDto: UploadFileStorageDto, file: Express.Multer.File) {
    const { type } = uploadFileStorageDto;
    const uploadedImage = await this.storageProvider.uploadFile(file);
    const fileStorage = await this.fileStorageRepository.save({
      name: uploadedImage,
      location: this.path + '/' + uploadedImage,
      type,
    });
    return { message: SuccessResponseMessages.successGeneral, data: fileStorage };
  }

  async getFilesStorage(getFileStorageDto: GetFileStorageDto): Promise<ApiMessageDataPagination> {
    const { type, page, limit } = getFileStorageDto;
    const skip = (page - 1) * limit;

    const query = this.fileStorageRepository.createQueryBuilder('file');
    if (type) query.andWhere('file.type = :type', { type });
    query.skip(skip).take(limit).orderBy({ 'file.createdAt': 'DESC' });

    const [items, total] = await query.getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: items,
      page,
      lastPage,
      total,
    };
  }

  async getFileStorage(id: number): Promise<ApiMessageData> {
    const fileStorage = await this.fileStorageRepository.findOne({ where: { id } });
    if (!fileStorage) throw new NotFoundException(FileStorageErrorMessages.fileStorageNotExists);
    return {
      message: SuccessResponseMessages.successGeneral,
      data: fileStorage,
    };
  }

  async updateFileStorage(id: number, updateFileStorageDto: UpdateFileStorageDto, file: Express.Multer.File) {
    const { type } = updateFileStorageDto;

    const fileStorageExists = await this.fileStorageRepository.findOne({ where: { id } });
    if (!fileStorageExists) throw new NotFoundException(FileStorageErrorMessages.fileStorageNotExists);

    const updatedModule = type !== undefined ? type : fileStorageExists.type;
    let uploadedImage = fileStorageExists.name;
    if (file) {
      if (fileStorageExists.name) await this.storageProvider.deleteFile(fileStorageExists.name);
      uploadedImage = await this.storageProvider.uploadFile(file);
    }
    fileStorageExists.name = uploadedImage;
    fileStorageExists.type = updatedModule;
    fileStorageExists.location = this.path + '/' + uploadedImage;
    const uploadedFile = await this.fileStorageRepository.save(fileStorageExists);

    return { message: SuccessResponseMessages.successGeneral, data: uploadedFile };
  }

  async deleteFileStorage(id: number): Promise<ApiMessageData> {
    const fileStorage = await this.fileStorageRepository.findOne({ where: { id } });
    if (fileStorage) {
      await this.storageProvider.deleteFile(fileStorage.name);
      await this.fileStorageRepository.delete(fileStorage.id);
    }
    //throw new NotFoundException(FileStorageErrorMessages.fileStorageNotExists);

    return {
      message: SuccessResponseMessages.successGeneral,
      data: fileStorage,
    };
  }
}
