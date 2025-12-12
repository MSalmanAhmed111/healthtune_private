import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@decorators';
import { PaginationQueryDto } from '@dtos';

export class OrganizationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by country' })
  country?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by state' })
  state?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by city' })
  city?: string;
}