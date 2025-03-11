import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FeaturePropertyDto {
  @ApiProperty({ description: 'Feature ID' })
  @IsNotEmpty()
  @IsNumber()
  featureId: number;

  @ApiProperty({ description: 'Feature properties in JSON format' })
  @IsNotEmpty()
  properties: Record<string, any>;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the plan' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price of the plan' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Type of the plan' })
  @IsNotEmpty()
  @IsString()
  planType: string;

  @ApiProperty({ description: 'List of feature properties', type: [FeaturePropertyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeaturePropertyDto)
  featureProperties: FeaturePropertyDto[];
}