import { Trim } from '@decorators';
import { PaginationQueryDto } from '@dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GetPatientsDto extends PaginationQueryDto {
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
}
