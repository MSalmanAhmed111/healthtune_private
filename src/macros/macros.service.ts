import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Macro, User, UserPlanUsage } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, PlanFeatureNameEnum } from '@types';
import { CreateMacroDto, PaginationQueryDto, UpdateMacroDto } from 'src/dto';
import { MacroErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class MacrosService {
  constructor(
    @InjectRepository(Macro)
    private readonly macroRepository: Repository<Macro>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
  ) {}

  async createMacro(reqBody: CreateMacroDto, userId: number): Promise<ApiMessageData> {
    const { name, content } = reqBody;

    // Get user with subscription info
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userPlan', 
        'userPlan.usage', 
        'userPlan.usage.planFeatureProperty', 
        'userPlan.usage.planFeatureProperty.feature',
        'organization',
        'organization.userPlan',
        'organization.userPlan.usage',
        'organization.userPlan.usage.planFeatureProperty',
        'organization.userPlan.usage.planFeatureProperty.feature'
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    // Check macro replacement usage before creating macro
    const effectiveSubscription = user.userPlan || user.organization?.userPlan;
    if (effectiveSubscription) {
      const usage = effectiveSubscription.usage.find((u) => u.planFeatureProperty.feature.name == PlanFeatureNameEnum.MACRO_REPLACEMENT);
      if (!usage) {
        throw new BadRequestException('Macro replacement is not available in your current plan');
      }
      if (usage.usageCount <= 0) throw new BadRequestException('No macro replacement credits left');
      usage.usageCount = usage.usageCount - 1;
      await this.userPlanUsageRepository.save(usage);
    }

    let macro = await this.macroRepository.findOne({ where: { name } });
    if (macro) throw new BadRequestException(MacroErrorMessages.macroAlreadyExists);
    macro = this.macroRepository.create({ name, content });
    await this.macroRepository.save(macro);
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }

  async updateMacro(macroId: number, reqBody: UpdateMacroDto): Promise<ApiMessageData> {
    const { name, content } = reqBody;
    const macro = await this.macroRepository.findOne({ where: { id: macroId } });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);
    if (name) {
      const macro = await this.macroRepository.findOne({ where: { name, id: Not(macroId) } });
      if (macro) throw new NotFoundException(MacroErrorMessages.macroNameAlreadyExists);
    }
    macro.name = name || macro.name;
    macro.content = content || macro.content;
    await this.macroRepository.save(macro);
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }

  async getMacros(getMacrosDto: PaginationQueryDto): Promise<ApiMessageDataPagination> {
    const { query, page, limit } = getMacrosDto;
    const qb = this.macroRepository.createQueryBuilder('macro');
    if (query) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(macro.name) LIKE LOWER(:query)', { query: `%${query}%` }).orWhere('LOWER(macro.content) LIKE LOWER(:query)', { query: `%${query}%` });
        }),
      );
    }
    qb.skip((page - 1) * limit).take(limit);
    const [macros, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: macros, page: page, total: total, lastPage: lastPage };
  }

  async getMacro(macroId: number): Promise<ApiMessageData> {
    const macro = await this.macroRepository.findOne({ where: { id: macroId } });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }

  async deleteMacros(macroId: number): Promise<ApiMessageData> {
    const macro = await this.macroRepository.findOne({ where: { id: macroId } });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);
    await this.macroRepository.delete({ id: macroId });
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }
}
