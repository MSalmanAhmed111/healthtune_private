import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsObject } from "class-validator";

export class AddTranscriptDto {
    @ApiProperty({ description: 'Assembly ID' })
    @IsNotEmpty()
    @IsString()
    assemblyId: string;

    @ApiProperty({ description: 'Content of the transcript' })
    @IsNotEmpty()
    @IsObject()
    content: object;
}