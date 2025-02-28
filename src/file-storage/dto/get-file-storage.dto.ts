import { IsOptional, IsNumber, IsEnum, IsString, IsDate } from 'class-validator';
import { ModuleEnum, SortEnum } from '@types';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@dtos';
import { Trim } from '@decorators';

export class GetFileStorageDto extends PaginationQueryDto {
  @IsString()
  @Trim()
  @IsOptional()
  @IsEnum(ModuleEnum)
  @ApiPropertyOptional({ description: 'Module name for file to be upload', enum: ModuleEnum })
  type?: ModuleEnum;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Created date of the document' })
  createDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Start date of the document' })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'End date of the document' })
  endDate?: Date;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort documents by' })
  sort?: SortEnum.ASC | SortEnum.DESC;
}
