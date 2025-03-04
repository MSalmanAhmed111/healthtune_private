import { Trim } from '@decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCurrentUserDto {
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  @ApiPropertyOptional({ description: 'First name of the user' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  @ApiPropertyOptional({ description: 'Last name of the user' })
  lastName: string;

  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  @ApiPropertyOptional({ description: 'Username of the user' })
  username: string;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: '12', description: 'ID of the uploaded profile image' })
  profileImage: number;
}
