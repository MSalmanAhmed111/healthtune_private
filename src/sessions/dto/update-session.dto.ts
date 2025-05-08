import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';
import { SessionStatusEnum } from '@types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiProperty({ example: Object.values(SessionStatusEnum), description: 'SessionStaus' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsIn(Object.values(SessionStatusEnum))
  status: SessionStatusEnum;
}
