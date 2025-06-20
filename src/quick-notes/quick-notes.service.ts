import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuickNotes } from '@entities';
import { Brackets, Not, Repository } from 'typeorm';
import { ApiMessageData, ApiMessageDataPagination } from '@types';
import { CreateQuickNotesDto, PaginationDto, PaginationQueryDto, UpdateQuickNotesDto } from 'src/dto';
import { QuickNotesErrorMessages, SuccessResponseMessages } from '@messages';
import { StorageProviderInterface } from 'src/common/providers';

@Injectable()
export class QuickNotessService {
  constructor(
    @InjectRepository(QuickNotes)
    private readonly quickNoteRepository: Repository<QuickNotes>,

    @Inject('StorageProvider')
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  async createQuickNote(userId: number, reqBody: CreateQuickNotesDto, file: Express.Multer.File): Promise<ApiMessageData> {
    const { transcript } = reqBody;
    const quickNote = this.quickNoteRepository.create({ userId, transcript });
    if (file) quickNote.file = await this.storageProvider.uploadFile(file);
    await this.quickNoteRepository.save(quickNote);
    return { message: SuccessResponseMessages.successGeneral, data: quickNote };
  }

  async updateQuickNote(quickNoteId: number, reqBody: UpdateQuickNotesDto, file: Express.Multer.File): Promise<ApiMessageData> {
    const { transcript } = reqBody;
    const quickNote = await this.quickNoteRepository.findOne({ where: { id: quickNoteId } });
    if (!quickNote) throw new NotFoundException(QuickNotesErrorMessages.quickNotesNotExists);
    if (file) {
      if (quickNote.file) await this.storageProvider.deleteFile(quickNote.file);
      quickNote.file = await this.storageProvider.uploadFile(file);
    }
    quickNote.transcript = transcript || quickNote.transcript;
    await this.quickNoteRepository.save(quickNote);
    return { message: SuccessResponseMessages.successGeneral, data: quickNote };
  }

  async getQuickNotes(getQuickNotessDto: PaginationDto): Promise<ApiMessageDataPagination> {
    const { page, limit } = getQuickNotessDto;
    const qb = this.quickNoteRepository.createQueryBuilder('quickNote').orderBy({ 'quickNote.createdAt': 'DESC' });
    qb.skip((page - 1) * limit).take(limit);
    const [quickNotes, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    return { message: SuccessResponseMessages.successGeneral, data: quickNotes, page: page, total: total, lastPage: lastPage };
  }

  async getQuickNote(quickNoteId: number): Promise<ApiMessageData> {
    const quickNote = await this.quickNoteRepository.findOne({ where: { id: quickNoteId } });
    if (!quickNote) throw new NotFoundException(QuickNotesErrorMessages.quickNotesNotExists);
    return { message: SuccessResponseMessages.successGeneral, data: quickNote };
  }

  async deleteQuickNotes(quickNoteId: number): Promise<ApiMessageData> {
    const quickNote = await this.quickNoteRepository.findOne({ where: { id: quickNoteId } });
    if (!quickNote) throw new NotFoundException(QuickNotesErrorMessages.quickNotesNotExists);
    await this.quickNoteRepository.delete({ id: quickNoteId });
    return { message: SuccessResponseMessages.successGeneral, data: quickNote };
  }
}
