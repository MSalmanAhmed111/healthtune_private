import { PartialType } from '@nestjs/mapped-types';
import { CreateMacroDto } from './create-macros.dto';

export class UpdateMacroDto extends PartialType(CreateMacroDto) {}
