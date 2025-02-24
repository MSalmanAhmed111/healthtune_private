import { Trim } from '@decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
