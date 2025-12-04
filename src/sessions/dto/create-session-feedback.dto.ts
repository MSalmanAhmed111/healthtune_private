import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@decorators';

export class CreateSessionFeedbackDto {
  @ApiProperty({ 
    example: 'The session audio quality was excellent, but I experienced some delay in processing the results.', 
    description: 'Feedback text describing any issues or comments about the session' 
  })
  @IsNotEmpty()
  @Trim()
  @IsString()
  feedback: string;
}
