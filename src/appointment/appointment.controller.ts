import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreateAppointmentDto, GetAppointmentsDto, UpdateAppointmentDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Appointment')
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new appointment')
  async createAppointment(@Body() reqBody: CreateAppointmentDto): Promise<ApiMessageData> {
    return await this.appointmentService.createAppointment(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update appointment')
  async updateAppointment(@Param('id', ValidateId) appointmentId: number, @Body() reqBody: UpdateAppointmentDto) {
    return await this.appointmentService.updateAppointment(appointmentId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all user appointment')
  async getUserAppointments(@Query() queryParams: GetAppointmentsDto, @Req() req: Request) {
    return await this.appointmentService.getUserAppointments(queryParams, +req.user.id);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get user appointment by ID')
  async getUserAppointment(@Param('id', ValidateId) appointmentId: number, @Req() reqBody: Request) {
    return await this.appointmentService.getUserAppointment(appointmentId, +reqBody.user.id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete user appointment by ID')
  async deleteUserAppointment(@Param('id', ValidateId) appointmentId: number, @Req() req: Request) {
    return await this.appointmentService.deleteUserAppointment(appointmentId, +req.user.id);
  }

  // ADMIN APIS

  // @Get('/')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get all appointment')
  // async getAppointments(@Query() queryParams: GetAppointmentsDto) {
  //   return await this.appointmentService.getAppointments(queryParams);
  // }

  // @Get('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get a appointment by ID')
  // async getAppointment(@Param('id', ValidateId) appointmentId: number) {
  //   return await this.appointmentService.getAppointment(appointmentId);
  // }

  // @Delete('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Delete a appointment by ID')
  // async deleteAppointment(@Param('id', ValidateId) appointmentId: number) {
  //   return await this.appointmentService.deleteAppointment(appointmentId);
  // }
}
