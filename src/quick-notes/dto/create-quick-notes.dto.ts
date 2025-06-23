import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';

export class CreateQuickNotesDto {
  @ApiProperty({ description: 'Content/transcript of the quick notes' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  transcript: string;
}
