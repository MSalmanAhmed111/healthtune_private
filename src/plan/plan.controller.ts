import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete } from '@nestjs/common';
import { MacrosService } from './plan.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreateMacroDto, PaginationQueryDto, UpdateMacroDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('Macros')
@Controller('plan')
export class MacrosController {
  constructor(private readonly planService: MacrosService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new plan')
  async createMacro(@Body() reqBody: CreateMacroDto): Promise<ApiMessageData> {
    return await this.planService.createMacro(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update plan')
  async updateMacro(@Param('id', ValidateId) planId: number, @Body() reqBody: UpdateMacroDto) {
    return await this.planService.updateMacro(planId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all plan')
  async getMacros(@Query() queryParams: PaginationQueryDto) {
    return await this.planService.getMacros(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a plan by ID')
  async getMacro(@Param('id', ValidateId) planId: number) {
    return await this.planService.getMacro(planId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a plan by ID')
  async deleteMacros(@Param('id', ValidateId) planId: number) {
    return await this.planService.deleteMacros(planId);
  }
}
