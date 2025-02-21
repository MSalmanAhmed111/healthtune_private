import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@entities';
import { SuccessResponseMessages } from '@messages';
import { ApiMessageData } from '@types';

@Injectable()
export class ClerkWebhookService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async syncUser(reqBody): Promise<ApiMessageData> {
    const { clerkUserId, email, firstName, lastName, username, imageUrl, publicMetadata, privateMetadata, unsafeMetadata } = reqBody;
    console.log('reqBody: ', reqBody);
    let user = await this.userRepository.findOne({ where: [{ clerkUserId }, { email }] });

    if (user) {
      user.firstName = firstName ?? user.firstName;
      user.lastName = lastName ?? user.lastName;
      user.username = username ?? user.username;
      user.imageUrl = imageUrl ?? user.imageUrl;
      user.publicMetadata = publicMetadata ?? user.publicMetadata;
      user.privateMetadata = privateMetadata ?? user.privateMetadata;
      user.unsafeMetadata = unsafeMetadata ?? user.unsafeMetadata;

      await this.userRepository.save(user);
      return { message: SuccessResponseMessages.successGeneral, data: user };
    } else {
      user = this.userRepository.create({
        clerkUserId,
        email,
        firstName,
        lastName,
        username,
        imageUrl,
        publicMetadata,
        privateMetadata,
        unsafeMetadata,
      });

      await this.userRepository.save(user);
      return { message: SuccessResponseMessages.successGeneral, data: user };
    }
  }
}
