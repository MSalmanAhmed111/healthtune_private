import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsObject, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class AddTranscriptDto {
  @IsOptional()
  @ApiProperty({ description: 'Assembly ID' })
  @IsNotEmpty()
  @IsString()
  assemblyId: string;

  @IsOptional()
  @ApiProperty({ description: 'Content of the transcript' })
  @IsNotEmpty()
  @IsObject()
  content: object;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Duration of the session' })
  duration?: number | null;

  @ApiPropertyOptional({ example: '12', description: 'ID of the uploaded audio file' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  audioFile: number;
}
