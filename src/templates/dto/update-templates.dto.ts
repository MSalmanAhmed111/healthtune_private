import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-templates.dto';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
