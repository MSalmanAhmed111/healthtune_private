import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { Trim } from '@decorators';
import { GenderEnum } from '@types';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: '123', description: 'ID of the patient' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId: number;

  @ApiProperty({ example: '123', description: 'ID of the appointment' })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appointmentId: number;

  @ApiProperty({ description: 'First name of the patient' })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @IsString()
  patientFirstName: string;

  @ApiProperty({ description: 'Last name of the patient' })
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @IsString()
  patientLastName: string;

  @ApiProperty({ description: 'Gender of the patient' })
  @IsOptional()
  @ValidateIf((o) => o.sex !== undefined && o.sex !== null)
  @IsEnum(GenderEnum)
  sex?: GenderEnum;

  @ApiProperty({ description: 'Type of the session' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  //@IsEnum(SessionTypeEnum)
  //sessionType: SessionTypeEnum;
  sessionType: string;

  @ApiProperty({ description: 'Note format of the session' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  //@IsEnum(NoteFormatEnum)
  //noteFormat: NoteFormatEnum;
  noteFormat: string;

  @ApiProperty({ description: 'Language of the session' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  //@IsEnum(LanguageEnum)
  //language: LanguageEnum;
  language: string;
}
