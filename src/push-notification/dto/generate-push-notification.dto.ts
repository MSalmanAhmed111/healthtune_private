import { Trim } from '@decorators';
import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePushNotificationDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @ApiProperty({ description: 'Title of the push notification' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  @ApiProperty({ description: 'Body of the push notification' })
  body: string;

  @IsNotEmpty()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @Min(1, { each: true })
  @ApiProperty({ description: 'Array of user ids' })
  userIds: number[];
}
