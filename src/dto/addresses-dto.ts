import { RegexConstants } from '@constants/index';
import { Trim } from '@decorators';
import { ErrorResponseMessages } from '@messages';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches, IsOptional, IsNumber, IsNumberString } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(2, 150)
  @ApiProperty({ description: 'street address' })
  streetAddress: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Matches(RegexConstants.ONLY_LETTERS_SPACES, { message: 'City ' + ErrorResponseMessages.mustBePureString })
  @ApiProperty({ description: 'City for the address' })
  city: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Length(2, 150)
  @ApiProperty({ description: 'Area for the address' })
  area: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  @Trim()
  @ApiPropertyOptional({ description: 'Postal code for the address' })
  postalCode: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Trim()
  @Matches(RegexConstants.ONLY_LETTERS_SPACES, { message: 'Country ' + ErrorResponseMessages.mustBePureString })
  @ApiProperty({ description: 'Country for the address' })
  country: string;
}

export class LongLatAddressDto extends AddressDto {
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @ApiProperty({ description: 'Longitude coordinate' })
  longitude?: number | null;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @ApiProperty({ description: 'Latitude coordinate' })
  latitude?: number | null;
}
