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
  ) { }

  async generateToken(userId: number) {
    try {
      const fetchedUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!fetchedUser) throw new NotFoundException(`User not found with clerkId: ${userId}`);

      const clerkUserId = fetchedUser.clerkUserId;
      const sessions = await this.clerkClient.sessions.getSessionList({ userId: clerkUserId });

      let sessionId = null;
      for (const session of sessions.data) {
        if (session.status !== 'removed') {
          sessionId = session.id;
          break;
        }
      }

      // If no active session is found, generate a new token
      if (!sessionId) {
        const token = await this.clerkClient.signInTokens.createSignInToken({ userId: clerkUserId, expiresInSeconds: 220000 });
        return { token };
      }
      try {
        // Fetch the token for the existing session
        const token = await this.clerkClient.sessions.getToken(sessionId, 'Standard');
        return { token };
      } catch (err) {
        // Session exists but can't fetch token (e.g., expired), fallback to generating new token
        console.warn('Failed to fetch token from existing session, generating new token.');
        const token = await this.clerkClient.signInTokens.createSignInToken({ userId: clerkUserId, expiresInSeconds: 220000 });
        return { token };
      }

    } catch (error) {
      throw new Error(`Failed to generate token: ${error}`);
    }
  }
}
