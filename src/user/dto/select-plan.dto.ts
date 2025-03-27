import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl } from "class-validator";

export class SelectPlanDto {
    @IsOptional()
    @IsString()
    @IsUrl()
    @ApiPropertyOptional({ description: 'Rediection url after successful payment' })
    successURL?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    @ApiPropertyOptional({ description: 'Redirection url after cancelling payment' })
    cancelURL?: string;
}