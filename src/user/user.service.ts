import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FileStorage, Plan, User, UserPlan, UserPlanUsage } from '@entities';
import { SuccessResponseMessages, ErrorResponseMessages, userErrorMessages, PlanErrorMessages } from '@messages';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageDataPagination, ApiMessageData, PlanTypeEnum } from '@types';
import { Repository, Brackets } from 'typeorm';
import { GetUsersDto, UpdateCurrentUserDto, UpdateUserDto } from '@dtos';
import { ClerkClient } from '@clerk/backend';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private readonly userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly fileStorageService: FileStorageService,
  ) {}

  private readonly userFields = ['user.id', 'user.clerkUserId', 'user.firstName', 'user.lastName', 'user.username', 'user.email', 'user.imageUrl', 'user.banned', 'user.publicMetadata'];

  async selectPlanForUser(userId: number, planId: number): Promise<ApiMessageData> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(userErrorMessages.userNotExists);

    const plan = await this.planRepository.findOne({ where: { id: planId }, relations: ['features'] });
    if (!plan) throw new NotFoundException(PlanErrorMessages.planNotExists);

    let userPlan = await this.userPlanRepository.findOne({ where: { user: { id: userId } }, relations: ['usage'] });

    if (userPlan) {
      if (userPlan.isSubscriptionActive) throw new BadRequestException(`User already have an ongoing subscription of ${plan.name}.`);
      userPlan.plan = plan;
      userPlan.startDate = new Date();
      userPlan.isSubscriptionActive = true;
    } else {
      const endDate = plan.planType === PlanTypeEnum.MONTHLY ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : plan.planType === PlanTypeEnum.YEARLY ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
      userPlan = this.userPlanRepository.create({
        user,
        plan,
        startDate: new Date(),
        endDate,
        isSubscriptionActive: true,
        usage: [],
      });
    }

    userPlan.usage = userPlan.usage || [];

    for (const feature of plan.features) {
      if (feature?.properties?.isUnlimited === null) continue;

      console.log('comes here');

      const newUsage = this.userPlanUsageRepository.create({
        planFeatureProperty: feature,
        planFeaturePropertyId: feature.id,
        usageCount: feature.properties.limit || null,
      });

      userPlan.usage.push(newUsage);
    }

    await this.userPlanRepository.save(userPlan);
    user.userPlanId = userPlan.id;
    await this.userRepository.save(user);

    return { message: SuccessResponseMessages.successGeneral, data: userPlan };
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
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
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
