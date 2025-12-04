import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Macro, User, UserPlanUsage } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination, PlanFeatureNameEnum } from '@types';
import { CreateMacroDto, PaginationQueryDto, UpdateMacroDto } from 'src/dto';
import { MacroErrorMessages, SuccessResponseMessages } from '@messages';
import { PlanUsageService } from 'src/common/services/plan-usage.service';

@Injectable()
export class MacrosService {
  private readonly logger = new Logger('MacrosService');

  constructor(
    @InjectRepository(Macro)
    private readonly macroRepository: Repository<Macro>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPlanUsage)
    private readonly userPlanUsageRepository: Repository<UserPlanUsage>,
    private readonly planUsageService: PlanUsageService,
  ) {}

  async createMacro(reqBody: CreateMacroDto, userId: number): Promise<ApiMessageData> {
    const { name, content } = reqBody;

    // Get user with organization info
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Track usage consumption (always increment for tracking, even unlimited plans)
    const orgId = user.organizationId;
    try {
      await this.planUsageService.trackUsage(orgId, PlanFeatureNameEnum.MACRO_REPLACEMENT, 1);
    } catch (error) {
      this.logger.error(`Failed to track macro usage for org ${orgId}: ${error.message}`);
      // Don't block macro creation if usage tracking fails
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

  async deleteMacros(macroId: number, userId?: number): Promise<ApiMessageData> {
    const macro = await this.macroRepository.findOne({ where: { id: macroId } });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);
    
    // Restore usage if user info provided
    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['organization'],
      });
      if (user) {
        try {
          // Decrement to reverse the increment (restore the quota)
          await this.planUsageService.trackUsage(user.organizationId, PlanFeatureNameEnum.MACRO_REPLACEMENT, -1);
        } catch (error) {
          // Don't block deletion if usage restoration fails
        }
      }
    }
    
    await this.macroRepository.delete({ id: macroId });
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }
}
