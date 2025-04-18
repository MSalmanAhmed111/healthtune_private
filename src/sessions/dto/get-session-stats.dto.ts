import { DateDurationDto } from '@dtos';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt, Min, IsString, IsEnum } from 'class-validator';

export class GetSessionStatsDto extends PartialType(DateDurationDto) {
  @ApiProperty({ example: '123', description: 'ID of the user' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 'daily or monthlyor yearly', description: 'Order of the stats' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEnum(['daily', 'monthly', 'yearly', 'weekly'])
  orderWise: 'daily' | 'monthly' | 'yearly' | 'weekly';

  @ApiProperty({ example: 'sessionCount or sessionDuration', description: 'Type of session stats graph' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEnum(['sessionCount', 'sessionDuration'])
  type: 'sessionCount' | 'sessionDuration';
}
