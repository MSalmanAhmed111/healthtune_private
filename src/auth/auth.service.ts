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
      const sessions = await this.clerkClient.sessions.getSessionList({ userId: clerkUserId });
      if (!sessions.data.length) throw new NotFoundException('No session found for user with clerkId: ' + userId);
      let sessionId = null;
      for (const session of sessions.data) {
        if (session.status !== 'removed') {
          sessionId = session.id;
          break;
        }
      }
      if (sessionId === null) throw new NotFoundException('No active session found for user with clerkId: ' + userId);
      const token = await this.clerkClient.sessions.getToken(sessionId, 'Standard');
      return { token };
    } catch (error) {
      throw new Error(`Failed to generate token: ${error}`);
    }
  }
}
