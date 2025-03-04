import { DateDurationDto } from '@dtos';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';

export class GetSessionStatsDto extends PartialType(DateDurationDto) {
  @ApiProperty({ example: '123', description: 'ID of the user' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;
}
