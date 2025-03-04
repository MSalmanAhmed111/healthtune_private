import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { UpdateCurrentUserDto } from './update-current-user.dto';

export class UpdateUserDto extends UpdateCurrentUserDto {
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : ''))
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Banned/active/deleted status of user' })
  banned?: boolean;

}

