import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';

export class CreateMacroDto {
  @ApiProperty({ description: 'Name of the macro' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Content/Description of the macro' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  content: string;
}
