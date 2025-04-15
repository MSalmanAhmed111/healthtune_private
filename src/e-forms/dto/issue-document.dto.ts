import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsInt, Min } from 'class-validator';
import { Trim } from '@decorators';
import { Type } from 'class-transformer';

export class FieldValueDto {
    @ApiProperty({ description: 'Field ID', example: 'name' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    fieldId: string;

    @ApiProperty({ description: 'Field Value', example: 'Shuaib' })
    // @IsString()
    @Trim()
    @IsNotEmpty()
    fieldValue: any;
}

export class UpsertDocumentIssuanceDto {
    @ApiProperty({ description: 'Document Business ID', example: 1 })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    documentId: number;

    @ApiProperty({ description: 'Patient ID', example: 1 })
    @Trim()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    patientId: number;

    @ApiProperty({ description: 'Issued To Organization Code', example: 'STK' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    issuedToOrgCode: string;

    @ApiProperty({ description: 'Description', example: 'Test issuance' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    description: string;

    @ApiProperty({ description: 'Array of Field Values', type: () => [FieldValueDto] })
    @ValidateNested({ each: true })
    @Type(() => FieldValueDto)
    @IsArray()
    fieldValues: FieldValueDto[];

    @ApiPropertyOptional({ description: 'Business Product ID', example: null })
    @IsOptional()
    @IsString()
    @Trim()
    businessProductId?: string | null;

    @ApiPropertyOptional({ description: 'Tag ID', example: null })
    @IsOptional()
    @IsString()
    @Trim()
    tagId?: string | null;
}