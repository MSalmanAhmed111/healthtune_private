import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsNumber, IsArray, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@decorators';


class AddNoteDto {
  @ApiProperty({ description: 'Content of the note' })
  @IsNotEmpty()
  @IsString()
  content: string;
}

// === AddTranscriptDto ===
class AddTranscriptDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assemblyId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: object;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;
}

export class SessionCostDto {

  @ApiProperty({
    example: 946,
    description: 'Total number of input tokens',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalInputTokens: number;

  @ApiProperty({
    example: 266,
    description: 'Total number of output tokens',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalOutputTokens: number;

  @ApiProperty({
    example: 1212,
    description: 'Total tokens processed in the session',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalTokens: number;

  @ApiProperty({
    example: '$0.000142',
    description: 'Cost of input tokens in USD',
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalInputCost: string;

  @ApiProperty({
    example: '$0.000160',
    description: 'Cost of output tokens in USD',
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalOutputCost: string;

  @ApiProperty({
    example: '$0.000301',
    description: 'Total cost of the session in USD',
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  totalSessionCost: string;

  @ApiProperty({
    example: ['Speaker Classification', 'Consolidated Session Notes'],
    description: 'List of operations performed during the session',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  operations: string[];
}

export class AddSessionDetailsDto {
  @ApiPropertyOptional({
    type: AddNoteDto,
    example: {
      content: 'This session involved deep breathing techniques.',
    },
  })
  @ValidateNested()
  @Type(() => AddNoteDto)
  @IsOptional()
  summary?: AddNoteDto;

  @ApiPropertyOptional({
    type: AddNoteDto,
    example: {
      content: 'The doctor advised weekly follow-ups.',
    },
  })
  @ValidateNested()
  @Type(() => AddNoteDto)
  @IsOptional()
  doctorNotes?: AddNoteDto;

  @ApiPropertyOptional({
    type: AddNoteDto,
    example: {
      content: 'ICD-10: F41.1 - Generalized anxiety disorder',
    },
  })
  @ValidateNested()
  @Type(() => AddNoteDto)
  @IsOptional()
  diagnosisCodes?: AddNoteDto;

  @ApiPropertyOptional({
    type: AddTranscriptDto,
    example: {
      assemblyId: 'asd87asd7as8d7',
      content: 'Patient discussed recurring sleep issues...',
      duration: 132.5,
    },
  })
  @ValidateNested()
  @Type(() => AddTranscriptDto)
  @IsOptional()
  transcript?: AddTranscriptDto;

  @ValidateNested()
  @Type(() => SessionCostDto)
  @IsOptional()
  @ApiPropertyOptional({
    type: SessionCostDto,
    example: {
      sessionId: '79',
      patient: 'SaraM',
      doctor: 'Mohib',
      totalInputTokens: 946,
      totalOutputTokens: 266,
      totalTokens: 1212,
      totalInputCost: '$0.000142',
      totalOutputCost: '$0.000160',
      totalSessionCost: '$0.000301',
      operations: ['Speaker Classification', 'Consolidated Session Notes'],
    },
  })
  cost?: SessionCostDto;
}
