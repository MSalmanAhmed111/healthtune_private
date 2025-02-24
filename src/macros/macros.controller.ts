import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete } from '@nestjs/common';
import { MacrosService } from './macros.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreateMacroDto, PaginationQueryDto, UpdateMacroDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('Macros')
@Controller('macros')
export class MacrosController {
  constructor(private readonly macrosService: MacrosService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new macro')
  async createMacro(@Body() reqBody: CreateMacroDto): Promise<ApiMessageData> {
    return await this.macrosService.createMacro(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update macro')
  async updateMacro(@Param('id', ValidateId) macroId: number, @Body() reqBody: UpdateMacroDto) {
    return await this.macrosService.updateMacro(macroId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all macros')
  async getMacros(@Query() queryParams: PaginationQueryDto) {
    return await this.macrosService.getMacros(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a macro by ID')
  async getMacro(@Param('id', ValidateId) macroId: number) {
    return await this.macrosService.getMacro(macroId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a macro by ID')
  async deleteMacros(@Param('id', ValidateId) macroId: number) {
    return await this.macrosService.deleteMacros(macroId);
  }
}
