import { Trim } from '@decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogTypeEnum, NotificationTypeEnum, PriorityTypeEnum, SortEnum } from '@types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsPositive, IsDate, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '@dtos';

export class GetQueryNotificationDto extends PaginationQueryDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Start date range of the notifications' })
  createDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Start date range of the notification' })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'End date range of the notification' })
  endDate?: Date;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort batch by', enum: SortEnum })
  sort?: 'ASC' | 'DESC';

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(NotificationTypeEnum)
  @ApiPropertyOptional({ description: 'Sort by type', enum: NotificationTypeEnum })
  type?: NotificationTypeEnum;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(PriorityTypeEnum)
  @ApiPropertyOptional({ description: 'Sort by priority', enum: PriorityTypeEnum })
  priority?: PriorityTypeEnum;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Sort by read or unread' })
  isRead?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @ApiPropertyOptional({ description: 'Filter by userId', minimum: 1 })
  userId?: number;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter notifications by metadata values' })
  metadata?: Record<string, any>;
}
