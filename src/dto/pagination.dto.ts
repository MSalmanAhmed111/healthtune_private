import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@decorators';
import { SortEnum } from '@types';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Page number' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Limit of data per page' })
  limit?: number = 10000;
}

export class PaginationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'search query' })
  query?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort orders by created date ascending or descending' })
  sort?: SortEnum.ASC | SortEnum.DESC;
}

export class PaginationUserQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  @ApiPropertyOptional({ description: 'Id of the user' })
  userId: number;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'search query' })
  query?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort orders by created date ascending or descending' })
  sort?: SortEnum.ASC | SortEnum.DESC;
}
