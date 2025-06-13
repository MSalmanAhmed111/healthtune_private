import { Admin } from '@entities';
import { adminErrorMessages, SuccessResponseMessages } from '@messages';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageData } from '@types';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminLoginDto } from '@dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  
  async login(loginDto: AdminLoginDto): Promise<ApiMessageData> {
    const { email, password } = loginDto;

    if (!password) throw new BadRequestException('Password is required for local login');

    const admin = await this.adminRepository.createQueryBuilder('user').select(['user.id', 'user.firstName', 'user.lastName', 'user.password', 'user.email', 'user.isVerified', 'user.isActive', 'user.provider']).where('user.email = :email', { email }).getOne();

    if (!admin) throw new BadRequestException(adminErrorMessages.invalidEmail);

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) throw new BadRequestException(adminErrorMessages.invalidPassword);

    const atSecret = this.configService.get<string>('jwt.accessTokenKey');
    const atExpiry = this.configService.get<string>('jwt.accessExpiry');
    const access_token = await this.jwtService.signAsync({ id: admin.id }, { secret: atSecret, expiresIn: atExpiry });

    const responseData = {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      access_token,
    };

    return {
      message: SuccessResponseMessages.successGeneral,
      data: responseData,
    };
  }
}
