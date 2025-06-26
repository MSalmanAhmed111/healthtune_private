import { Trim } from '@decorators';
import { PaginationQueryDto } from '@dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

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

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : ''))
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by today appointment' })
  byTodayAppointment?: boolean;
}
