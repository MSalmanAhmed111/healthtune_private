import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { NoteFormatEnum, SessionTypeEnum, SessionStatusEnum, GenderEnum, LanguageEnum } from '@types';

export class CreateSessionDto {
    @ApiProperty({ description: 'Name of the session' })
    @IsNotEmpty()
    @IsString()
    patientName: string;

    @ApiProperty({ description: 'Gender of the patient' })
    @IsNotEmpty()
    @IsEnum(GenderEnum)
    sex: GenderEnum;

    @ApiProperty({ description: 'Type of the session' })
    @IsNotEmpty()
    @IsEnum(SessionTypeEnum)
    sessionType: SessionTypeEnum;

    @ApiProperty({ description: 'Note format of the session' })
    @IsNotEmpty()
    @IsEnum(NoteFormatEnum)
    noteFormat: NoteFormatEnum;

    @ApiProperty({ description: 'Language of the session' })
    @IsNotEmpty()
    @IsEnum(LanguageEnum)
    language: LanguageEnum;

    @ApiProperty({ description: 'Status of the session', default: SessionStatusEnum.PROCESS })
    @IsNotEmpty()
    @IsEnum(SessionStatusEnum)
    status: SessionStatusEnum;
}




