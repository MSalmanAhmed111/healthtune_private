import { PaginationUserQueryDto } from '@dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, IsPositive } from 'class-validator';

export class GetSessionsDto extends PaginationUserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  @ApiPropertyOptional({ description: 'Id of the patient for filteration' })
  patientId: number;
}
