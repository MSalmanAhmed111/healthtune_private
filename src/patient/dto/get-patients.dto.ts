import { Trim } from '@decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, IsNotEmpty } from 'class-validator';

export class GetPatientsDto {
  @ApiPropertyOptional({ description: 'Search query for patient name or content' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by gender' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  gender?: string;

  @ApiPropertyOptional({ description: 'Filter by marital status' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by nationality' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
