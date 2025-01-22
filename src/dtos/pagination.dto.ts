import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@decorators';
import { SortEnum } from '@types';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10000;
}

export class PaginationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Trim()
  @ApiProperty({ description: 'search query' })
  query?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiProperty({ description: 'Sort orders by created date ascending or descending' })
  sort?: SortEnum.ASC | SortEnum.DESC;
}
