import { Trim } from '@decorators';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleEnum } from '@types';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UploadFileStorageDto {
  @IsString()
  @Trim()
  @IsEnum(ModuleEnum)
  @IsNotEmpty()
  @ApiProperty({ description: 'Module name for file to be upload' })
  type: ModuleEnum;
}
