import { Trim } from '@decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsObject } from 'class-validator';

function JsonTransform({ value }: { value: any }) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function ArrayTransform({ value }: { value: any }) {
  if (Array.isArray(value)) return value;
  return value !== undefined ? [value] : [];
}

//
// ---- NoteDetails DTO ----
//
export class AddNoteDetailsDto {
  @ApiProperty({ description: 'Content of the note' })
  @IsNotEmpty()
  @Transform(JsonTransform)
  content: string | Record<string, string>;
}

//
// ---- TranscriptDetails DTO ----
//
export class AddTranscriptDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assemblyId: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(JsonTransform)
  content: string | Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;
}

//
// ---- Cost DTO ----
//
export class CostDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @Transform(ArrayTransform)
  operations: string[];

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  totalInputTokens: number;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  totalOutputTokens: number;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  totalTokens: number;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  totalCost: number;

  @ApiProperty({ example: '$0.000142', description: 'Cost of input tokens in USD' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalInputCost: string;

  @ApiProperty({ example: '$0.000160', description: 'Cost of output tokens in USD' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalOutputCost: string;

  @ApiProperty({ example: '$0.000301', description: 'Total cost of the session in USD' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalSessionCost: string;
}

//
// ---- Main CreateSessionDto ----
//
export class AddSessionDetailsDto {
  @ApiPropertyOptional({ type: AddTranscriptDetailsDto })
  @IsOptional()
  transcript?: AddTranscriptDetailsDto;

  @ApiPropertyOptional({ type: AddNoteDetailsDto })
  @IsOptional()
  summary?: AddNoteDetailsDto;

  @ApiPropertyOptional({ type: AddNoteDetailsDto })
  @IsOptional()
  doctorNotes?: AddNoteDetailsDto;

  @ApiPropertyOptional({ type: AddNoteDetailsDto })
  @IsOptional()
  diagnosisCodes?: AddNoteDetailsDto;

  @ApiPropertyOptional({ type: CostDto })
  @IsOptional()
  cost?: CostDto;
}
