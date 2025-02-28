import { ClerkClient } from '@clerk/backend';
import { User } from '@entities';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
  ) {}

  async generateToken(userId: number) {
    try {
      const fetchedUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!fetchedUser) throw new NotFoundException('User not found with clerkId: ' + userId);
      const clerkUserId = fetchedUser.clerkUserId;
      const sessions: any = await this.clerkClient.sessions.getSessionList({ userId: clerkUserId });
      const token = await this.clerkClient.sessions.getToken(sessions.data[0].id, 'Standard');

      return { token };
    } catch (error) {
      throw new Error(`Failed to generate token: ${error.message}`);
    }
  }
}
