import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsEmail, IsNotEmpty, IsString, IsIn } from "class-validator";

export class AdminLoginDto {
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  @ApiPropertyOptional({ description: 'User email address', example: 'user@example.com' })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Password', example: 'password123' })
  password?: string;

}
