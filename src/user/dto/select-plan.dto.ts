import { Matches, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RedirectionUrlDto {
  @IsOptional()
  @Matches(/^(https?:\/\/)(localhost|[\w.-]+)(:\d+)?(\/[\w.-]*)*\/?$/, { message: 'successURL must be a valid URL' })
  @ApiPropertyOptional({ description: 'Redirection URL after successful payment' })
  successURL?: string;

  @IsOptional()
  @Matches(/^(https?:\/\/)(localhost|[\w.-]+)(:\d+)?(\/[\w.-]*)*\/?$/, { message: 'cancelURL must be a valid URL' })
  @ApiPropertyOptional({ description: 'Redirection URL after cancelling payment' })
  cancelURL?: string;
}
