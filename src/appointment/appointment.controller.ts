import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData, PermissionEnum } from '@types';
import { CreateAppointmentDto, GetAppointmentsDto, UpdateAppointmentDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Appointment')
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new appointment')
  @Permissions(PermissionEnum.CREATE_APPOINTMENT)
  async createUserAppointment(@Body() reqBody: CreateAppointmentDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.appointmentService.createAppointment(reqBody, +req.user.id);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update appointment')
  @Permissions(PermissionEnum.CREATE_APPOINTMENT)
  async updateAppointment(@Param('id', ValidateId) appointmentId: number, @Body() reqBody: UpdateAppointmentDto, @Req() req: Request) {
    return await this.appointmentService.updateAppointment(appointmentId, reqBody, +req.user.id);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all user appointment')
  @Permissions(PermissionEnum.VIEW_ALL_APPOINTMENTS, PermissionEnum.VIEW_APPOINTMENT)
  async getUserAppointments(@Query() queryParams: GetAppointmentsDto, @Req() req: Request) {
    return await this.appointmentService.getAppointments(queryParams, +req.user.id);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get user appointment by ID')
  @Permissions(PermissionEnum.VIEW_ALL_APPOINTMENTS, PermissionEnum.VIEW_APPOINTMENT)
  async getUserAppointment(@Param('id', ValidateId) appointmentId: number, @Req() reqBody: Request) {
    return await this.appointmentService.getAppointment(appointmentId, +reqBody.user.id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete user appointment by ID')
  @Permissions(PermissionEnum.VIEW_APPOINTMENT)
  async deleteUserAppointment(@Param('id', ValidateId) appointmentId: number, @Req() req: Request) {
    return await this.appointmentService.deleteAppointment(appointmentId, +req.user.id);
  }
}
