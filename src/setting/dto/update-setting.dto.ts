import { IsValidSettingType } from '@decorators';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class SettingDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsValidSettingType()
  value: string | number | object | boolean | null;
}

export class UpdateSettingsDto {
  @ValidateNested({ each: true })
  @Type(() => SettingDto)
  settings: SettingDto[];
}
