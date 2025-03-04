import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FileStorage, User } from '@entities';
import { SuccessResponseMessages, ErrorResponseMessages, userErrorMessages } from '@messages';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageDataPagination, ApiMessageData } from '@types';
import { Repository, Brackets } from 'typeorm';
import { GetUsersDto, UpdateCurrentUserDto, UpdateUserDto } from '@dtos';
import { ClerkClient } from '@clerk/backend';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FileStorage)
    private readonly fileStorageRepository: Repository<FileStorage>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly fileStorageService: FileStorageService,
  ) {}

  private readonly userFields = ['user.id', 'user.firstName', 'user.lastName', 'user.username', 'user.email', 'user.imageUrl', 'user.banned', 'user.publicMetadata'];

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
      if (image) fetchedUser.profileImage = { id: image.id, image: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
  }

  async getUser(userId: number): Promise<ApiMessageData> {
    const fetchedUser = await this.userRepository.createQueryBuilder('user').select(this.userFields).where('user.id = :userId', { userId }).getOne();
    if (!fetchedUser) throw new NotFoundException(userErrorMessages.userNotExists);
    if (fetchedUser.profileImage) {
      const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
      if (image) fetchedUser.profileImage = { id: image.id, image: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
  }

  // ? ADMIN APIS

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
            .orWhere('user.userName ILIKE :query', { query: `%${query}%` })
            .orWhere('user.email ILIKE :query', { query: `%${query}%` });
        }),
      );
    }

    qb.skip(skip).take(limit).orderBy({ 'user.createdAt': 'DESC' });

    const [items, total] = await qb.select(this.userFields).getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    for (const fetchedUser of items) {
      if (fetchedUser.profileImage) {
        const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
        if (image) fetchedUser.profileImage = { id: image.id, image: image.name };
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

    if (banned) {
      await this.clerkClient.users.banUser(fetchedUser.clerkUserId).catch((error) => {
        console.error('Error updating Clerk user:', error);
        throw new InternalServerErrorException('Failed to update user in Clerk.');
      });
    } else if (!banned) {
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
      if (image) fetchedUser.profileImage = { id: image.id, image: image.name };
    }
    return { message: SuccessResponseMessages.successGeneral, data: fetchedUser };
  }
}
