import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Title of the template' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content/Description of the template' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  prompt: string;
}
