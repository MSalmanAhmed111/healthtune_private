import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FileStorage, Plan, SubscriptionHistory, User, UserPlan, UserPlanUsage } from '@entities';
import { SuccessResponseMessages, ErrorResponseMessages, userErrorMessages, PlanErrorMessages } from '@messages';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageDataPagination, ApiMessageData, SeedPlanNamesEnum, ApiMessage } from '@types';
import { Repository, Brackets } from 'typeorm';
import { GetUsersDto, RedirectionUrlDto, UpdateCurrentUserDto, UpdateUserDto } from '@dtos';
import { ClerkClient } from '@clerk/backend';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { StripeHelper } from '@helpers/stripe.helper';
import { ConfigService } from '@nestjs/config';
import { StripeWebhookService } from 'src/webhooks/stripe/stripe-webhook.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepository: Repository<SubscriptionHistory>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private stripeHelper: StripeHelper,
    private configService: ConfigService,
    private stripeWebhookServie: StripeWebhookService,
    private readonly fileStorageService: FileStorageService,
  ) { }

  private readonly userFields = ['user.id', 'user.clerkUserId', 'user.firstName', 'user.lastName', 'user.username', 'user.email', 'user.imageUrl', 'user.banned', 'user.publicMetadata'];

  async selectPlanForUser(userId: number, planId: number, reqBody: RedirectionUrlDto): Promise<ApiMessageData> {
    let { cancelURL, successURL } = reqBody;
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(userErrorMessages.userNotExists);

    if (!user.stripeCustomerId) {
      (user.stripeCustomerId = await this.stripeHelper.createCustomer({ id: user.id, clerkUserId: user.clerkUserId }, user.email, `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`)), (user = await this.userRepository.save(user));
    }

    const plan = await this.planRepository.findOne({ where: { id: planId }, relations: ['features'] });
    if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);
    let userPlan = await this.userPlanRepository.findOne({ where: { user: { id: userId } }, relations: ['usage'] });

    if (userPlan.isSubscriptionActive && planId == userPlan.planId) throw new BadRequestException(`User already have an ongoing subscription of ${plan.name}.`);

    if (plan.name === SeedPlanNamesEnum.BASIC_PLAN) {

      if (user.stripeSubscriptiontId) {
        await this.stripeHelper.cancelSubscription(user.stripeSubscriptiontId)
      }
      else {
        userPlan = await this.stripeWebhookServie.createNewUserPlan(user, plan);
      }
      return {
        message: SuccessResponseMessages.successGeneral,
        data: null,
      };
    } else {

      const appURL = this.configService.get('APP_URL') || 'https://dev-app.healthytune.com';
      successURL = successURL || `${appURL}/home`;
      cancelURL = cancelURL || `${appURL}/home`;

      return {
        message: SuccessResponseMessages.successGeneral,
        data: {
          url: await this.stripeHelper.createPaymentSession({ planId: plan.id, userId: user.id, clerkUserId: user.clerkUserId }, user.stripeCustomerId, successURL, cancelURL, plan.stripePriceId),
          userPlan,
        },
      };
    }
  }

  async cancelSubscription(userId: number): Promise<ApiMessageData> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    const plan = await this.planRepository.findOne({ where: { name: SeedPlanNamesEnum.BASIC_PLAN }, relations: ['features'] });
    let userPlan = await this.userPlanRepository.findOne({ where: { user: { id: userId } }, relations: ['usage'] });
    if (userPlan.planId === plan.id) throw new BadRequestException(userErrorMessages.noPaidPlanSubscritionActive);
    await this.stripeHelper.cancelSubscription(user.stripeSubscriptiontId)
    // user.stripeSubscriptiontId = null;
    // user = await this.userRepository.save({ ...user, stripeSubscriptiontId: null });
    // userPlan = await this.userPlanRepository.save({ ...userPlan, isSubscriptionActive: false });

    return {
      message: SuccessResponseMessages.successGeneral,
      data: null,
    };

  }

  async updateCurrentUser(userId: number, updateCurrentUserDto: UpdateCurrentUserDto): Promise<ApiMessageData> {
    const { firstName, lastName, username, profileImage } = updateCurrentUserDto;
    let fetchedUser = await this.userRepository.createQueryBuilder('user').select(this.userFields).where('user.id = :userId', { userId }).getOne();
    if (!fetchedUser) throw new NotFoundException(userErrorMessages.userNotExists);
    if (profileImage && profileImage !== fetchedUser.profileImage) {
      const imageExists = this.fileStorageRepository.findOne({ where: { id: profileImage as number } });
      if (!imageExists) throw new NotFoundException(ErrorResponseMessages.fileNotExists);
      if (fetchedUser.profileImage) {
        const previousImageExists = this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
        if (previousImageExists) await this.fileStorageService.deleteFileStorage(fetchedUser.profileImage as number);
      }
      fetchedUser.profileImage = profileImage;
    }
    fetchedUser.firstName = firstName || fetchedUser.firstName;
    fetchedUser.lastName = lastName || fetchedUser.lastName;
    fetchedUser.username = username || fetchedUser.username;

    fetchedUser = await this.userRepository.save(fetchedUser);
    if (fetchedUser.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
      if (image) fetchedUser.profileImage = { id: image.id, fileName: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
  }

  async getUser(userId: number): Promise<ApiMessageData> {
    const fetchedUser = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userPlan', 'userPlan')
      .leftJoinAndSelect('userPlan.plan', 'plan')
      .leftJoinAndSelect('userPlan.usage', 'usage')
      .leftJoinAndSelect('usage.planFeatureProperty', 'planFeatureProperty')
      .leftJoinAndSelect('planFeatureProperty.feature', 'feature')
      //.select(this.userFields)
      .where('user.id = :userId', { userId })
      .getOne();

    if (!fetchedUser) throw new NotFoundException(userErrorMessages.userNotExists);
    if (fetchedUser.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
      if (image) fetchedUser.profileImage = { id: image.id, fileName: image.name };
    }
    const usageArray: { featureName: string; left: number | null; total: number | null }[] = [];
    if (fetchedUser.userPlan && fetchedUser.userPlan.usage.length > 0) {
      fetchedUser.userPlan.usage.forEach((usage) => {
        const newUsage = {
          featureName: usage?.planFeatureProperty?.feature?.name || 'N/A',
          left: usage?.usageCount || null,
          total: usage?.planFeatureProperty?.properties?.limit || null,
        }
        usageArray.push(newUsage);
      });
    }
    return { message: SuccessResponseMessages.successGeneral, data: { ...fetchedUser, userPlan: { ...fetchedUser.userPlan, usage: usageArray } } };
  }

  async getUserCardDetails(userId: number): Promise<ApiMessageData> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);
    return {
      message: SuccessResponseMessages.successGeneral,
      data: await this.stripeHelper.retrieveCards(user.stripeCustomerId)
    };
  }

  async deleteUserCardDetails(userId: number): Promise<ApiMessage> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);
    await this.stripeHelper.deleteCard(user.stripeCustomerId)
    return {
      message: SuccessResponseMessages.successGeneral,
    };
  }

  // Add update card -> Generates card link
  async addUpdateCard(userId: number, stripeAccessDto: RedirectionUrlDto): Promise<ApiMessageData> {
    const { successURL, cancelURL } = stripeAccessDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);

    const appURL = this.configService.get('APP_URL') || 'https://dev-app.healthytune.com';
    const finalSuccessURL = successURL || `${appURL}/home`;
    const finalCancelURL = cancelURL || `${appURL}/home`;

    return {
      message: SuccessResponseMessages.successGeneral,
      data: {
        url: await this.stripeHelper.createCardSession(
          { userId },
          user.stripeCustomerId,
          finalSuccessURL,
          finalCancelURL
        ),
      },
    };
  }

  // ? SEPERATE ADMIN APIS

  async getUsers(getUsersDto: GetUsersDto): Promise<ApiMessageDataPagination> {
    const { query, banned = false, page, limit } = getUsersDto;
    const skip = (page - 1) * limit;

    const qb = this.userRepository.createQueryBuilder('user');

    if (banned === false || banned === true) qb.andWhere('user.banned = :banned', { banned });

    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.orWhere('user.firstName ILIKE :query', { query: `%${query}%` })
            .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
            .orWhere('user.username ILIKE :query', { query: `%${query}%` })
            .orWhere('user.email ILIKE :query', { query: `%${query}%` });
        }),
      );
    }

    qb.skip(skip).take(limit).orderBy({ 'user.createdAt': 'DESC' });

    const [items, total] = await qb.select([...this.userFields, 'user.createdAt', 'user.updatedAt']).getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    for (const fetchedUser of items) {
      if (fetchedUser.profileImage) {
        const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
        if (image) fetchedUser.profileImage = { id: image.id, fileName: image.name };
      }
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: items,
      total,
      page,
      lastPage,
    };
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<ApiMessageData> {
    const { firstName, lastName, username, banned, profileImage } = updateUserDto;
    let fetchedUser = await this.userRepository.createQueryBuilder('user').select(this.userFields).where('user.id = :userId', { userId }).getOne();
    if (!fetchedUser) throw new NotFoundException(userErrorMessages.userNotExists);

    if (banned === true) {
      await this.clerkClient.users.banUser(fetchedUser.clerkUserId).catch((error) => {
        console.error('Error updating Clerk user:', error);
        throw new InternalServerErrorException('Failed to update user in Clerk.');
      });
    } else if (banned === false) {
      await this.clerkClient.users.unbanUser(fetchedUser.clerkUserId).catch((error) => {
        console.error('Error updating Clerk user:', error);
        throw new InternalServerErrorException('Failed to update user in Clerk.');
      });
    }

    if (profileImage && profileImage !== fetchedUser.profileImage) {
      const imageExists = this.fileStorageRepository.findOne({ where: { id: profileImage as number } });
      if (!imageExists) throw new NotFoundException(ErrorResponseMessages.fileNotExists);
      if (fetchedUser.profileImage) {
        const previousImageExists = this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
        if (previousImageExists) await this.fileStorageService.deleteFileStorage(fetchedUser.profileImage as number);
      }
      fetchedUser.profileImage = profileImage;
    }

    fetchedUser.firstName = firstName || fetchedUser.firstName;
    fetchedUser.lastName = lastName || fetchedUser.lastName;
    fetchedUser.username = username || fetchedUser.username;
    fetchedUser.banned = banned !== undefined ? banned : fetchedUser.banned;
    fetchedUser = await this.userRepository.save(fetchedUser);
    if (fetchedUser.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
      if (image) fetchedUser.profileImage = { id: image.id, fileName: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
  }


}
