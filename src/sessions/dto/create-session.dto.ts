import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { NoteFormatEnum, SessionTypeEnum, SessionStatusEnum, GenderEnum, LanguageEnum } from '@types';
import { Trim } from '@decorators';

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
    @IsEnum(SessionTypeEnum)
    sessionType: SessionTypeEnum;

    @ApiProperty({ description: 'Note format of the session' })
    @IsEnum(NoteFormatEnum)
    noteFormat: NoteFormatEnum;

    @ApiProperty({ description: 'Language of the session' })
    @IsEnum(LanguageEnum)
    language: LanguageEnum;

}




