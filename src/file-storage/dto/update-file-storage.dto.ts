import { PartialType } from '@nestjs/swagger';
import { UploadFileStorageDto } from './upload-file-storage.dto';
import { Trim } from '@decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ModuleEnum } from '@types';

export class UpdateFileStorageDto extends PartialType(UploadFileStorageDto) {
  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(ModuleEnum)
  @ApiProperty({ description: 'Module name for file to be upload' })
  type: ModuleEnum;
}
