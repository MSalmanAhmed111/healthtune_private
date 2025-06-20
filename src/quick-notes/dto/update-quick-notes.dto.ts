import { PartialType } from '@nestjs/mapped-types';
import { CreateQuickNotesDto } from './create-quick-notes.dto';

export class UpdateQuickNotesDto extends PartialType(CreateQuickNotesDto) {}
