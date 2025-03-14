import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsArray, ValidateNested, isPositive, IsPositive, IsBoolean, IsInt, IsOptional, Min, IsNumberString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseFeatureProperties, FeatureLimitTypeEnum, PlanTypeEnum } from '@types';
import { Trim } from '@decorators';

export class BaseFeaturePropertiesDTO {
  @ApiPropertyOptional({ description: 'Indicates whether the feature is unlimited', example: false })
  @IsOptional()
  @IsBoolean()
  isUnlimited?: boolean;

  @ApiPropertyOptional({ description: 'Limit for the feature', example: 100 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number | null;

  @ApiPropertyOptional({ description: 'Type of limit applied (e.g., Monthly, Daily)', enum: FeatureLimitTypeEnum, example: FeatureLimitTypeEnum.MONTHLY })
  @IsOptional()
  @IsEnum(FeatureLimitTypeEnum)
  limitType?: FeatureLimitTypeEnum | null;
}

class FeaturePropertyDto {
  @ApiProperty({ description: 'Feature ID' })
  @IsNotEmpty()
  @IsNumber()
  featureId: number;

  @ApiProperty({ description: 'Display name of the plan feature' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ description: 'Description of the feature for display' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Feature properties in JSON format' })
  @ValidateNested()
  @Type(() => BaseFeaturePropertiesDTO)
  properties: BaseFeaturePropertiesDTO;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the plan' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Name of the plan' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Price of the plan' })
  @IsNotEmpty()
  @IsNumberString({})
  @Matches(/^\d+(\.\d+)?$/, { message: 'Price must be a valid positive number' })
  price: string;

  @ApiProperty({ description: 'Type of the plan' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsEnum(PlanTypeEnum)
  planType: PlanTypeEnum;

  @ApiProperty({ description: 'List of feature properties', type: [FeaturePropertyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeaturePropertyDto)
  features: FeaturePropertyDto[];
}
