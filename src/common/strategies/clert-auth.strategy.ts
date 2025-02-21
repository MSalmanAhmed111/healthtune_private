import { verifyToken } from '@clerk/backend';
import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ClerkClient } from '@clerk/backend';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@entities';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }

  async validate(req: Request): Promise<{ id: number; metaData: Record<string, any> }> {
    const token = req.headers.authorization?.split(' ').pop();

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const clerkSecretKey = this.configService.get('creds.clerkSecretKey');
      // console.log('TOKEN: ', token);
      // console.log('CLERK_SECRET_KEY: ', clerkSecretKey);

      // const decoded = this.jwtService.decode(token, { complete: true });
      // if (!decoded || !decoded.payload?.sub) {
      //   throw new UnauthorizedException('Invalid token payload');
      // }

      // console.log('Token Header:', decoded?.header);
      // console.log('Token Payload:', decoded.payload);

      const tokenPayload = await verifyToken(token, { secretKey: clerkSecretKey });
      if (!tokenPayload || !tokenPayload?.sub) throw new UnauthorizedException('Invalid token payload');

      const fetchedUser = await this.userRepository.findOne({ where: { clerkUserId: tokenPayload.sub } });
      if (!fetchedUser) throw new NotFoundException('User not found with clerkId: ' + tokenPayload.sub);

      return { id: fetchedUser.id, metaData: fetchedUser.publicMetadata };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
