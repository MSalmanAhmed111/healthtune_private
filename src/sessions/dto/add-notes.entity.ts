import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject } from "class-validator";

export class AddNoteDto {
    @ApiProperty({ description: 'Content of the note' })
    @IsNotEmpty()
    @IsObject()
    content: object;
}