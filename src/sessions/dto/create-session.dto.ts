import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';
import { GenderEnum } from '@types';

export class CreateSessionDto {
  @ApiProperty({ description: 'Name of the session' })
  @IsNotEmpty()
  @Trim()
  @IsString()
  patientName: string;

  @ApiProperty({ description: 'Gender of the patient' })
  @IsEnum(GenderEnum)
  sex: GenderEnum;

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
