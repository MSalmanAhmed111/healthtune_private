import { Trim } from '@decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsDate } from 'class-validator';

export class DateDurationDto {
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Duration start date ' })
  startDate: Date;

  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Duration end date' })
  endDate: Date;
}
