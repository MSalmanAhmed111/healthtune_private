import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Appointment, FileStorage, Plan, Session, SubscriptionHistory, User, UserPlan } from '@entities';
import { SuccessResponseMessages, ErrorResponseMessages, userErrorMessages, PlanErrorMessages } from '@messages';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiMessageDataPagination, ApiMessageData, SeedPlanNamesEnum, ApiMessage, SessionStatusEnum, PermissionEnum } from '@types';
import { Repository, Brackets, Between } from 'typeorm';
import { GetSessionStatsDto, GetUsersDto, PaginationDto, RedirectionUrlDto, UpdateCurrentUserDto, UpdateUserDto } from '@dtos';
import { ClerkClient } from '@clerk/backend';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { StripeHelper } from '@helpers/stripe.helper';
import { ConfigService } from '@nestjs/config';
import { StripeWebhookService } from 'src/webhooks/stripe/stripe-webhook.service';
import moment from 'moment';

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
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private stripeHelper: StripeHelper,
    private configService: ConfigService,
    private stripeWebhookServie: StripeWebhookService,
    private readonly fileStorageService: FileStorageService,
  ) {}

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
        await this.stripeHelper.cancelSubscription(user.stripeSubscriptiontId);
      } else {
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
    if (!userPlan.isSubscriptionActive) throw new BadRequestException(`User already unsubscriped ${plan.name}.`);
    await this.stripeHelper.cancelSubscription(user.stripeSubscriptiontId);
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
      .select([...this.userFields, 'user.createdAt', 'user.updatedAt', 'userPlan', 'plan', 'usage', 'planFeatureProperty', 'feature'])
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
        };
        usageArray.push(newUsage);
      });
    }
    return { message: SuccessResponseMessages.successGeneral, data: { ...fetchedUser, userPlan: { ...fetchedUser.userPlan, usage: usageArray } } };
  }

  async getUserSubscriptionHistory(userId: number, paginationDto: PaginationDto): Promise<ApiMessageDataPagination> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    let [userSubscriptionHistory, total] = await this.subscriptionHistoryRepository.findAndCount({ where: { userId }, take: limit, skip, order: { id: 'DESC' }, relations: ['plan'] });
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: userSubscriptionHistory, page: page, total: total, lastPage: lastPage };
  }

  async getUserCardDetails(userId: number): Promise<ApiMessageData> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);
    return {
      message: SuccessResponseMessages.successGeneral,
      data: await this.stripeHelper.retrieveCards(user.stripeCustomerId),
    };
  }

  async deleteUserCardDetails(userId: number): Promise<ApiMessage> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(userErrorMessages.userNotExists);
    await this.stripeHelper.deleteCard(user.stripeCustomerId);
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
        url: await this.stripeHelper.createCardSession({ userId }, user.stripeCustomerId, finalSuccessURL, finalCancelURL),
      },
    };
  }

  // ? SEPERATE ADMIN APIS

  async getUsers(getUsersDto: GetUsersDto): Promise<ApiMessageDataPagination> {
    const { query, banned = false, page, limit } = getUsersDto;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userPlan', 'userPlan')
      .leftJoinAndSelect('userPlan.plan', 'plan')
      .leftJoinAndSelect('userPlan.usage', 'usage')
      .leftJoinAndSelect('usage.planFeatureProperty', 'planFeatureProperty')
      .leftJoinAndSelect('planFeatureProperty.feature', 'feature');

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

    const [items, total] = await qb.select([...this.userFields, 'user.createdAt', 'user.updatedAt', 'userPlan', 'plan', 'usage', 'planFeatureProperty', 'feature']).getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    let data = [];

    for (const fetchedUser of items) {
      if (fetchedUser.profileImage) {
        const image = await this.fileStorageRepository.findOne({ where: { id: fetchedUser.profileImage as number } });
        if (image) fetchedUser.profileImage = { id: image.id, fileName: image.name };
      }
      const sessionCount = await this.sessionRepository.count({ where: { userId: fetchedUser.id } });
      const usageArray: { featureName: string; left: number | null; total: number | null }[] = [];
      if (fetchedUser.userPlan && fetchedUser.userPlan.usage.length > 0) {
        fetchedUser.userPlan.usage.forEach((usage) => {
          const newUsage = {
            featureName: usage?.planFeatureProperty?.feature?.name || 'N/A',
            left: usage?.usageCount || null,
            total: usage?.planFeatureProperty?.properties?.limit || null,
          };
          usageArray.push(newUsage);
        });
      }
      data.push({ ...fetchedUser, userPlan: { ...fetchedUser.userPlan, usage: usageArray }, sessionCount });
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: data,
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

  async getUserStats(reqQueryParams: GetSessionStatsDto, userId: number = undefined): Promise<ApiMessageData> {
    let { startDate, endDate } = reqQueryParams;
    let user = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role', 'role.permissions'] });
    }

    if (endDate) {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    if (reqQueryParams.userId) userId = reqQueryParams.userId;

    const hasViewSession = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_SESSION);
    const hasViewAllSessions = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_ALL_SESSIONS);
    const hasViewAppointment = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_APPOINTMENT);
    const hasViewAllAppointment = user?.role?.permissions?.some((p) => p.key === PermissionEnum.VIEW_ALL_APPOINTMENTS);

    const baseWhere: any = {
      ...(user && user.clerkOrganizationId && hasViewSession && hasViewAllSessions ? { patient: { organizationId: user.organizationId } } : { userId }),
      ...(startDate && endDate ? { createdAt: Between(startDate, endDate) } : {}),
    };
    const sessionCount = await this.sessionRepository.count({ where: baseWhere });

    let query = this.sessionRepository.createQueryBuilder('session').leftJoinAndSelect('session.patient', 'patient').select('session.status', 'status').addSelect('COUNT(*)', 'count');

    if (startDate && endDate) {
      query = query.where('session.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (userId) {
      if (user && user.clerkOrganizationId && hasViewSession && hasViewAllSessions) query = query.andWhere('patient.organizationId = :organizationId', { organizationId: user.organizationId });
      else query = query.andWhere('session.userId = :userId', { userId });
    }

    query = query.groupBy('session.status');

    const statusCountsRaw = await query.getRawMany();

    const statusCounts: Record<string, number> = Object.fromEntries(statusCountsRaw.map(({ status, count }) => [status, parseInt(count, 10)]));

    const allStatuses = Object.values(SessionStatusEnum);

    const statusCountsWithDefaults = allStatuses.reduce(
      (acc, status) => {
        acc[status] = statusCounts[status] || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    let durationQuery = this.sessionRepository.createQueryBuilder('session').leftJoinAndSelect('session.patient', 'patient').select('SUM(session.duration)', 'total');

    if (startDate && endDate) {
      durationQuery = durationQuery.where('session.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (userId) {
      //durationQuery = durationQuery.andWhere('session.userId = :userId', { userId });
      if (user && user.clerkOrganizationId && hasViewSession && hasViewAllSessions) durationQuery = durationQuery.andWhere('patient.organizationId = :organizationId', { organizationId: user.organizationId });
      else durationQuery = durationQuery.andWhere('session.userId = :userId', { userId });
    }

    const totalDurationResult = await durationQuery.getRawOne();
    const sessionTotalDuration = parseFloat(totalDurationResult.total) || 0;

    const avgDuration = sessionCount ? (sessionTotalDuration / sessionCount).toFixed(2) : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWhere: any = {
      //...(userId && { doctorId: userId }),
      ...(user && user.clerkOrganizationId && hasViewAppointment && hasViewAllAppointment ? { patient: { organizationId: user.organizationId } } : { doctorId: userId }),
      createdAt: Between(todayStart, todayEnd),
    };

    const todayAppointments = await this.appointmentRepository.count({ where: todayWhere, relations: ['patient'] });

    return {
      message: SuccessResponseMessages.successGeneral,
      data: {
        sessionCount,
        sessionCompletedCount: statusCountsWithDefaults[SessionStatusEnum.COMPLETED],
        sessionReviewedCount: statusCountsWithDefaults[SessionStatusEnum.REVIEWED],
        sessionApprovedCount: statusCountsWithDefaults[SessionStatusEnum.APPROVED],
        sessionCancelledCount: statusCountsWithDefaults[SessionStatusEnum.CANCELLED],
        sessionInProgressCount: statusCountsWithDefaults[SessionStatusEnum.PROCESS],
        sessionTotalDuration,
        sessionDurationAvg: avgDuration,
        todayAppointments,
      },
    };
  }

  async getUserStatsGraph(reqQueryParams: GetSessionStatsDto, userId?: number): Promise<ApiMessageData> {
    let { startDate, endDate, orderWise, type } = reqQueryParams;
    type = type || 'sessionCount';

    const start = moment(startDate || '2020-01-01').startOf('day');
    const end = moment(endDate || new Date()).endOf('day');
    const diffInDays = end.diff(start, 'days');
    const diffInMonths = end.diff(start, 'months');

    if (!orderWise) {
      if (diffInDays <= 31) orderWise = 'daily';
      else if (diffInMonths <= 2) orderWise = 'weekly';
      else if (diffInMonths <= 12) orderWise = 'monthly';
      else orderWise = 'yearly';
    }

    const result = [];
    let current = moment(start);

    while (current.isSameOrBefore(end)) {
      let label: string;
      let rangeStart = moment(current);
      let rangeEnd;

      switch (orderWise) {
        case 'daily':
          label = rangeStart.format('YYYY-MM-DD');
          rangeEnd = moment(rangeStart).endOf('day');
          current.add(1, 'day');
          break;
        case 'weekly': {
          const weekIndex = Math.floor(rangeStart.diff(start, 'weeks')) + 1;
          label = `Week ${weekIndex}`;
          rangeEnd = moment(rangeStart).endOf('week');
          current.add(1, 'week');
          break;
        }
        case 'monthly':
          label = rangeStart.format('MMM');
          rangeEnd = moment(rangeStart).endOf('month');
          current.add(1, 'month');
          break;
        case 'yearly':
          label = rangeStart.format('YYYY');
          rangeEnd = moment(rangeStart).endOf('year');
          current.add(1, 'year');
          break;
      }

      if (type === 'sessionCount') {
        const count = await this.sessionRepository.count({
          where: {
            ...(userId && { userId }),
            createdAt: Between(rangeStart.toDate(), rangeEnd.toDate()),
          },
        });
        result.push({ name: label, sessionCreationCount: count });
      } else if (type === 'sessionDuration') {
        const qb = this.sessionRepository.createQueryBuilder('session').select('SUM(session.duration)', 'totalDuration').where('session.createdAt BETWEEN :start AND :end', {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
        });

        if (userId) qb.andWhere('session.userId = :userId', { userId });

        const totalDuration = await qb.getRawOne();
        result.push({
          name: label,
          sessionTotalDuration: parseFloat(totalDuration.totalDuration) || 0,
        });
      }
    }

    return {
      message: SuccessResponseMessages.successGeneral,
      data: result,
    };
  }
}
