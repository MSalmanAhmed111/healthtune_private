import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SwaggerApiResponse } from '@decorators';
import { AdminLoginDto, CreateAppointmentDto, GetAppointmentsDto, GetSessionsDto, GetSessionStatsDto, PaginationUserQueryDto, UpdateAppointmentDto, UpdateUserDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { UserService } from 'src/user/user.service';
import { ApiTags } from '@nestjs/swagger';
import { AppointmentService } from 'src/appointment/appointment.service';
import { ApiMessageData } from '@types';
import { SessionService } from 'src/sessions/sessions.service';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthType } from 'src/common/decorators/auth-type.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    private readonly appointmentService: AppointmentService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('login')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Login')
  async login(@Body() reqBody: AdminLoginDto): Promise<ApiMessageData> {
    return await this.adminService.login(reqBody);
  }

  //  ==================================================================================================================================================================
  // ?                                                              USER APIS
  //  ==================================================================================================================================================================

  @Get('/user')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all users')
  async getUsers(@Query() queryParams: PaginationUserQueryDto): Promise<ApiMessageData> {
    return await this.userService.getUsers(queryParams);
  }

  @Get('/user/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUser(@Param('id', ValidateId) id: number): Promise<ApiMessageData> {
    return await this.userService.getUser(id);
  }

  @Put('/user/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update user')
  async updateUser(@Param('id', ValidateId) id: number, @Body() reqBody: UpdateUserDto): Promise<ApiMessageData> {
    return await this.userService.updateUser(id, reqBody);
  }

  //  ==================================================================================================================================================================
  // ?                                                              APPOINTMENT APIS
  //  ==================================================================================================================================================================

  @Post('/appointment')
  @AuthType('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new appointment')
  async createAppointment(@Body() reqBody: CreateAppointmentDto): Promise<ApiMessageData> {
    return await this.appointmentService.createAppointment(reqBody, reqBody.doctorId);
  }

  @Put('/appointment/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update appointment')
  async updateAppointment(@Param('id', ValidateId) appointmentId: number, @Body() reqBody: UpdateAppointmentDto) {
    return await this.appointmentService.updateAppointment(appointmentId, reqBody, reqBody.doctorId);
  }

  @Get('/appointment')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all appointments')
  async getAppointments(@Query() queryParams: GetAppointmentsDto): Promise<ApiMessageData> {
    return await this.appointmentService.getAppointments(queryParams);
  }

  @Get('/appointment/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get an appointment by ID')
  async getAppointment(@Param('id', ValidateId) appointmentId: number): Promise<ApiMessageData> {
    return await this.appointmentService.getAppointment(appointmentId);
  }

  @Delete('/appointment/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete an appointment by ID')
  async deleteAppointment(@Param('id', ValidateId) appointmentId: number): Promise<ApiMessageData> {
    return await this.appointmentService.deleteAppointment(appointmentId);
  }

  //  ==================================================================================================================================================================
  // ?                                                              SESSION APIS
  //  ==================================================================================================================================================================

  @Get('/session/stats')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get session stats')
  async getSessionStats(@Query() queryParams: GetSessionStatsDto) {
    return await this.userService.getUserStats(queryParams, queryParams.userId);
  }

  @Get('/session')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all sessions')
  async getSessions(@Query() queryParams: GetSessionsDto) {
    return await this.sessionService.getSessions(queryParams);
  }

  @Get('/session/:id')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a session by ID')
  async getSession(@Param('id', ValidateId) sessionId: number) {
    return await this.sessionService.getSession(sessionId);
  }
}
