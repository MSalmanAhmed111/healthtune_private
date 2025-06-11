import { ErrorResponseMessages } from '@messages';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { existsSync } from 'fs';
import { join } from 'path';
import { User, UserDevices } from 'src/entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserDevices)
    private readonly userDevicesRepository: Repository<UserDevices>,
  ) {}

  async onModuleInit() {
    const serviceAccountPath = join(__dirname, '..', '..', 'firebase-pkey.json');

    if (existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = await import(serviceAccountPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Error loading service account for Firebase:', error);
      }
    } else {
      console.warn(`Firebase credential file not found at path: ${serviceAccountPath}`);
    }
  }

  async getTokens(userIds = null) {
    const whereCondition: any = { isActive: true };
    if (userIds && userIds !== null) {
      if (!Array.isArray(userIds)) userIds = [userIds];
      whereCondition.userId = In(userIds);
    }
    const users = await this.userDevicesRepository.find({ where: whereCondition, select: ['fcmToken'] });
    const tokens = users.map((x) => x.fcmToken).filter((token) => token);
    return tokens;
  }
  async sendNotification(userIds: number[], title: string, body: string) {
    const tokens = await this.getTokens(userIds);
    if (!tokens.length) return new Error('No fcm Token found');

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
        // icon,
      },
    });

    if (response.successCount <= 0) {
      console.log({ FcmResponse: response.responses[0].error });
      return new Error('Error sending push notification');
    }
    return response;
  }
}
