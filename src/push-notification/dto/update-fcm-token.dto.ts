import { Trim } from '@decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFcmTokenUpdateDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  deviceId: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Fcm token' })
  fcmToken?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @ApiPropertyOptional({ description: 'Active filter' })
  isActive?: boolean;
}
