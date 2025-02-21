import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@entities';
import { SuccessResponseMessages } from '@messages';
import { ApiMessageData } from '@types';
//import { User as ClerkUser } from '@clerk/backend';

@Injectable()
export class ClerkWebhookService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async syncUser(reqBody): Promise<ApiMessageData> {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata, username, primary_email_address_id, private_metadata, unsafe_metadata } = reqBody;
    console.log('reqBody: ', reqBody);
    const email = email_addresses[0].email_address;
    let user = await this.userRepository.findOne({ where: [{ clerkUserId: id }, { email }] });

    if (user) {
      user.firstName = first_name ?? user.firstName;
      user.lastName = last_name ?? user.lastName;
      user.username = username ?? user.username;
      user.imageUrl = image_url ?? user.imageUrl;
      user.publicMetadata = public_metadata ?? user.publicMetadata;
      user.privateMetadata = private_metadata ?? user.privateMetadata;
      user.unsafeMetadata = unsafe_metadata ?? user.unsafeMetadata;

      await this.userRepository.save(user);
      return { message: SuccessResponseMessages.successGeneral, data: user };
    } else {
      user = this.userRepository.create({
        clerkUserId: id,
        email,
        username,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
        publicMetadata: public_metadata,
        privateMetadata: private_metadata,
        unsafeMetadata: unsafe_metadata,
        primaryEmailAddressId: primary_email_address_id,
      });

      await this.userRepository.save(user);
      return { message: SuccessResponseMessages.successGeneral, data: user };
    }
  }
}
