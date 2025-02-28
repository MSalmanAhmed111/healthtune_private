import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsNumber, IsOptional } from 'class-validator';

export class AddTranscriptDto {
  @ApiProperty({ description: 'Assembly ID' })
  @IsNotEmpty()
  @IsString()
  assemblyId: string;

  @ApiProperty({ description: 'Content of the transcript' })
  @IsNotEmpty()
  @IsObject()
  content: object;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Duration of the session' })
  duration?: number | null;
}
