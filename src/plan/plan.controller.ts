import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete } from '@nestjs/common';
import { PlanService } from './plan.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreatePlanDto, PaginationQueryDto, UpdatePlanDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('Plan')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new plan')
  async createPlan(@Body() reqBody: CreatePlanDto): Promise<ApiMessageData> {
    return await this.planService.createPlan(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update plan')
  async updatePlan(@Param('id', ValidateId) planId: number, @Body() reqBody: UpdatePlanDto) {
    return await this.planService.updatePlan(planId, reqBody);
  }

  // @Get('/')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get all plan')
  // async getPlan(@Query() queryParams: PaginationQueryDto) {
  //   return await this.planService.getPlan(queryParams);
  // }

  // @Get('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get a plan by ID')
  // async getPlan(@Param('id', ValidateId) planId: number) {
  //   return await this.planService.getPlan(planId);
  // }

  // @Delete('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Delete a plan by ID')
  // async deletePlan(@Param('id', ValidateId) planId: number) {
  //   return await this.planService.deletePlan(planId);
  // }
}
