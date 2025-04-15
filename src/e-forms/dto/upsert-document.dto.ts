import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Trim } from '@decorators';
import { Type } from 'class-transformer';

export class FieldDto {
    @ApiProperty({ description: 'Field ID', example: 'name' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ description: 'Field Name', example: 'name' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Field Data Type', example: 'string' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    dataType: string;

    @ApiProperty({ description: 'Page Number', example: 1 })
    @IsInt()
    @IsNotEmpty()
    pageNo: number;

    @ApiProperty({ description: 'X Coordinate', example: 250 })
    @IsInt()
    @IsNotEmpty()
    x: number;

    @ApiProperty({ description: 'Y Coordinate', example: 290 })
    @IsInt()
    @IsNotEmpty()
    y: number;
}

// export class QrCodeLocationDto {
//     @ApiProperty({ description: 'Page Number for QR Code', example: 1 })
//     @IsInt()
//     @IsNotEmpty()
//     pageNo: number;

//     @ApiProperty({ description: 'X Coordinate for QR Code', example: 250 })
//     @IsInt()
//     @IsNotEmpty()
//     x: number;

//     @ApiProperty({ description: 'Y Coordinate for QR Code', example: 290 })
//     @IsInt()
//     @IsNotEmpty()
//     y: number;
// }

export class UpsertDocumentDto {
    @ApiProperty({ description: 'Document Business ID', example: 1 })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    @IsOptional()
    documentId: number;

    @ApiProperty({ description: 'Document Name', example: 'This is the degree' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    documentName: string;

    @ApiProperty({ description: 'Document Type', example: 'Education' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    type: string;

    @ApiProperty({ description: 'Document Description', example: 'This is the degree' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    description: string;

    @ApiPropertyOptional({
        description: 'Array of Image URLs',
        example: [
            'https://static.vecteezy.com/system/resources/thumbnails/006/692/271/small_2x/document-icon-template-black-color-editable-document-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg',
        ],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({ description: 'Array of Fields', type: () => [FieldDto] })
    @ValidateNested({ each: true })
    @Type(() => FieldDto)
    @IsArray()
    fields: FieldDto[];

    @ApiProperty({ description: 'Template Document Hash', example: 'd23d5aaadc56a0770c03b6e1a6fe637dab566e988ef09b49575cd8189f0865dc7f4650fb96d432dc43983f4177c2fe9e6dc0167d19cfab94b4f6d222801b0f89' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    templateDocHash: string;

    // @ApiProperty({ description: 'QR Code Location', type: () => QrCodeLocationDto })
    // @ValidateNested()
    // @Type(() => QrCodeLocationDto)
    // @IsNotEmpty()
    // qrCodeLocation: QrCodeLocationDto;

    @ApiProperty({ description: 'Document Status', example: 'active' })
    @IsString()
    @Trim()
    @IsNotEmpty()
    @IsOptional()
    status: string;
}