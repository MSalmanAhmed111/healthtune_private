import { Trim } from '@decorators';
import { PaginationUserQueryDto } from '@dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, IsPositive, IsDate, IsNotEmpty } from 'class-validator';

export class GetSessionsDto extends PaginationUserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  @ApiPropertyOptional({ description: 'Id of the patient for filteration' })
  patientId: number;

  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by appointments on or after this start date' })
  startDate?: Date;

  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by appointments on or before this end date' })
  endDate?: Date;
}
