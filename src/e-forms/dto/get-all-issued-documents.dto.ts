import { Trim } from '@decorators';
import { PaginationQueryDto } from 'src/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min, IsOptional, IsNumber } from 'class-validator';

export class GetAllIssuedDocumentsDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Document Business ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @IsOptional()
  documentId: number;

  @ApiProperty({ description: 'Patient ID', example: 1 })
  @Trim()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  patientId: number;
}
