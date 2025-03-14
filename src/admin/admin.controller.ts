import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SwaggerApiResponse } from '@decorators';
import { CreateAppointmentDto, GetAppointmentsDto, GetSessionsDto, GetSessionStatsDto, PaginationUserQueryDto, UpdateAppointmentDto, UpdateUserDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { UserService } from 'src/user/user.service';
import { ApiTags } from '@nestjs/swagger';
import { AppointmentService } from 'src/appointment/appointment.service';
import { ApiMessageData } from '@types';
import { SessionService } from 'src/sessions/sessions.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    private readonly appointmentService: AppointmentService,
    private readonly sessionService: SessionService,
  ) {}

  //  ==================================================================================================================================================================
  // ?                                                              USER APIS
  //  ==================================================================================================================================================================

  @Get('/user')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all users')
  async getUsers(@Query() queryParams: PaginationUserQueryDto): Promise<ApiMessageData> {
    return await this.userService.getUsers(queryParams);
  }

  @Get('/user/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUser(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.userService.getUser(id);
  }

  @Put('/user/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update user')
  async updateUser(@Param('id', ValidateId) id: number, @Body() reqBody: UpdateUserDto): Promise<ApiMessageData> {
    return await this.userService.updateUser(id, reqBody);
  }

  //  ==================================================================================================================================================================
  // ?                                                              APPOINTMENT APIS
  //  ==================================================================================================================================================================

  @Post('/appointment')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new appointment')
  async createAppointment(@Body() reqBody: CreateAppointmentDto): Promise<ApiMessageData> {
    return await this.appointmentService.createAppointment(reqBody, reqBody.doctorId);
  }

  @Put('/appointment/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update appointment')
  async updateAppointment(@Param('id', ValidateId) appointmentId: number, @Body() reqBody: UpdateAppointmentDto) {
    return await this.appointmentService.updateAppointment(appointmentId, reqBody, reqBody.doctorId);
  }

  @Get('/appointment')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all appointments')
  async getAppointments(@Query() queryParams: GetAppointmentsDto): Promise<ApiMessageData> {
    return await this.appointmentService.getAppointments(queryParams);
  }

  @Get('/appointment/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get an appointment by ID')
  async getAppointment(@Param('id', ValidateId) appointmentId: number): Promise<ApiMessageData> {
    return await this.appointmentService.getAppointment(appointmentId);
  }

  @Delete('/appointment/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete an appointment by ID')
  async deleteAppointment(@Param('id', ValidateId) appointmentId: number): Promise<ApiMessageData> {
    return await this.appointmentService.deleteAppointment(appointmentId);
  }

  //  ==================================================================================================================================================================
  // ?                                                              SESSION APIS
  //  ==================================================================================================================================================================

  @Get('/session/stats')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get session stats')
  async getSessionStats(@Query() queryParams: GetSessionStatsDto) {
    return await this.sessionService.getSessionStats(queryParams, queryParams.userId);
  }

  @Get('/session')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all sessions')
  async getSessions(@Query() queryParams: GetSessionsDto) {
    return await this.sessionService.getSessions(queryParams);
  }

  @Get('/session/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a session by ID')
  async getSession(@Param('id', ValidateId) sessionId: number) {
    return await this.sessionService.getSession(sessionId);
  }
}
