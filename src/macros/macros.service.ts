import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Macro } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreateMacroDto, PaginationQueryDto, UpdateMacroDto } from 'src/dto';
import { MacroErrorMessages, SuccessResponseMessages } from '@messages';

@Injectable()
export class MacrosService {
  constructor(
    @InjectRepository(Macro)
    private readonly macroRepository: Repository<Macro>,
  ) {}

  async createMacro(reqBody: CreateMacroDto): Promise<ApiMessageData> {
    const { name, content } = reqBody;

    let macro = await this.macroRepository.findOne({ where: { name } });
    if (macro) throw new BadRequestException(MacroErrorMessages.macroAlreadyExists);

    macro = this.macroRepository.create({ name, content });
    await this.macroRepository.save(macro);

    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }

  async updateMacro(macroId: number, reqBody: UpdateMacroDto): Promise<ApiMessageData> {
    const { name, content } = reqBody;

    let macro = await this.macroRepository.findOne({ where: { id: macroId } });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);

    if (name) {
      const macro = await this.macroRepository.findOne({ where: { name, id: Not(macroId) } });
      if (!macro) throw new NotFoundException(MacroErrorMessages.macroNameAlreadyExists);
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
    const macro = await this.macroRepository.findOne({ where: { id: macroId }, relations: ['note', 'transcript'] });
    if (!macro) throw new NotFoundException(MacroErrorMessages.macroNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: macro };
  }
}
