import { UserDevices, User } from "@entities";
import { SuccessResponseMessages, userErrorMessages } from "@messages";
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiMessage } from "@types";
import { FirebaseService } from "src/firebase/firebase.service";
import { Repository } from "typeorm";
import { UpdateFcmTokenUpdateDto } from "./dto";


@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(UserDevices)
    private readonly userDevicesRepository: Repository<UserDevices>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async updateFcmToken(userId: number, updateFcmTokenUpdateDto: UpdateFcmTokenUpdateDto): Promise<ApiMessage> {
    const { deviceId, fcmToken, isActive } = updateFcmTokenUpdateDto;
    console.log({ userId, deviceId, fcmToken, isActive });
    if (!fcmToken && isActive === undefined) throw new BadRequestException('Both isActive field and fcmToken field should not be empty');
    const userDevices = await this.userDevicesRepository.findOne({ where: { deviceId, userId } });
    if (userDevices && userDevices.fcmToken) {
      userDevices.fcmToken = fcmToken ? fcmToken : userDevices.fcmToken;
      userDevices.isActive = isActive !== undefined ? isActive : userDevices.isActive;
      await this.userDevicesRepository.save(userDevices);
      return { message: SuccessResponseMessages.successGeneral };
    }
    if (!fcmToken) throw new BadRequestException('When adding new user device the fcmToken field should not be empty');
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);
    const newUserDevice = this.userDevicesRepository.create({ user, userId, deviceId, fcmToken, isActive: isActive !== undefined ? isActive : true });
    await this.userDevicesRepository.save(newUserDevice);
    return { message: SuccessResponseMessages.successGeneral };
  }
}
