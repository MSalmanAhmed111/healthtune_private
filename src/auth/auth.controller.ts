import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SwaggerApiResponse } from '@decorators';
import { ValidateId } from '@pipes/validate-id.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('/token/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get token')
  async generateToken(@Param('id', ValidateId) userId: number) {
    return await this.authService.generateToken(userId);
  }
}
