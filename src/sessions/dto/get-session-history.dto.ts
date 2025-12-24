import { Trim } from '@decorators';
import { PaginationQueryDto } from '@dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsDate, IsEnum } from 'class-validator';
import { SessionStatusEnum, SortEnum } from '@types';

export class GetSessionHistoryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter sessions on or after this start date' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter sessions on or before this end date' })
  endDate?: Date;

  @IsOptional()
  @IsEnum(SessionStatusEnum)
  @ApiPropertyOptional({ description: 'Filter by session status' })
  status?: SessionStatusEnum;

  @IsOptional()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort order by creation date (ASC or DESC)', default: SortEnum.DESC })
  sort?: SortEnum.ASC | SortEnum.DESC;
}
