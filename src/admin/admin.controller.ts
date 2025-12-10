import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SwaggerApiResponse } from '@decorators';
import { AdminLoginDto, CreateAppointmentDto, GetAppointmentsDto, GetSessionsDto, GetSessionStatsDto, PaginationUserQueryDto, UpdateAppointmentDto, UpdateUserDto, CreatePlanDto, UpdatePlanDto, PaginationQueryDto } from '@dtos';
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

  // Organization Subscription Management

  @Get('/organizations')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all organizations with subscriptions')
  async getAllOrganizations(
    @Query('country') country?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
  ): Promise<ApiMessageData> {
    return await this.adminService.getAllOrganizations(country, state, city);
  }

  @Get('/organizations/:organizationId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get organization details')
  async getOrganizationDetails(
    @Param('organizationId', ValidateId) organizationId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.getOrganizationDetails(organizationId);
  }

  @Get('/organizations/:organizationId/subscription')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get organization subscription details')
  async getOrganizationSubscription(
    @Param('organizationId', ValidateId) organizationId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.getOrganizationSubscription(organizationId);
  }

  @Get('/organizations/:organizationId/subscription-history')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get organization subscription history')
  async getOrganizationSubscriptionHistory(
    @Param('organizationId', ValidateId) organizationId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.getOrganizationSubscriptionHistory(organizationId);
  }

  @Post('/organizations/:organizationId/assign-plan/:planId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Assign plan to organization')
  async assignPlanToOrganization(
    @Param('organizationId', ValidateId) organizationId: number,
    @Param('planId', ValidateId) planId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.assignPlanToOrganization(organizationId, planId);
  }

  @Delete('/organizations/:organizationId/subscription')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Cancel organization subscription')
  async cancelOrganizationSubscription(
    @Param('organizationId', ValidateId) organizationId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.cancelOrganizationSubscription(organizationId);
  }

  @Post('/organizations/:organizationId/cancel-subscription')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Cancel organization subscription')
  async cancelOrganizationSubscriptionPost(
    @Param('organizationId', ValidateId) organizationId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.cancelOrganizationSubscription(organizationId);
  }

  //  ==================================================================================================================================================================
  // ?                                                              PLAN CRUD APIS
  //  ==================================================================================================================================================================

  @Post('/plans')
  @AuthType('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new plan')
  async createPlan(@Body() reqBody: CreatePlanDto): Promise<ApiMessageData> {
    return await this.adminService.createPlan(reqBody);
  }

  @Get('/plans')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all plans with pagination')
  async getPlans(@Query() queryParams: PaginationQueryDto): Promise<ApiMessageData> {
    return await this.adminService.getPlans(queryParams);
  }

  @Get('/plans/:planId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a plan by ID')
  async getPlan(@Param('planId', ValidateId) planId: number): Promise<ApiMessageData> {
    return await this.adminService.getPlan(planId);
  }

  @Put('/plans/:planId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update a plan')
  async updatePlan(
    @Param('planId', ValidateId) planId: number,
    @Body() reqBody: UpdatePlanDto
  ): Promise<ApiMessageData> {
    return await this.adminService.updatePlan(planId, reqBody);
  }

  @Delete('/plans/:planId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a plan')
  async deletePlan(@Param('planId', ValidateId) planId: number): Promise<ApiMessageData> {
    return await this.adminService.deletePlan(planId);
  }

  //  ==================================================================================================================================================================
  // ?                                                              FEATURE APIS
  //  ==================================================================================================================================================================

  @Get('/features')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all available features')
  async getFeatures(): Promise<ApiMessageData> {
    return await this.adminService.getFeatures();
  }

  //  ==================================================================================================================================================================
  // ?                                                              INDIVIDUAL USER SUBSCRIPTION APIS
  //  ==================================================================================================================================================================

  @Get('/individuals')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all individual users with subscriptions')
  async getAllIndividuals(): Promise<ApiMessageData> {
    return await this.adminService.getAllIndividuals();
  }

  @Get('/individuals/:userId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get individual user subscription details')
  async getIndividualDetails(@Param('userId', ValidateId) userId: number): Promise<ApiMessageData> {
    return await this.adminService.getIndividualDetails(userId);
  }

  @Get('/individuals/:userId/subscription')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get individual user subscription')
  async getIndividualSubscription(@Param('userId', ValidateId) userId: number): Promise<ApiMessageData> {
    return await this.adminService.getIndividualSubscription(userId);
  }

  @Get('/individuals/:userId/subscription-history')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get individual subscription history')
  async getIndividualSubscriptionHistory(@Param('userId', ValidateId) userId: number): Promise<ApiMessageData> {
    return await this.adminService.getIndividualSubscriptionHistory(userId);
  }

  @Post('/individuals/:userId/assign-plan/:planId')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Assign plan to individual user')
  async assignPlanToIndividual(
    @Param('userId', ValidateId) userId: number,
    @Param('planId', ValidateId) planId: number
  ): Promise<ApiMessageData> {
    return await this.adminService.assignPlanToIndividual(userId, planId);
  }

  @Post('/individuals/:userId/cancel-subscription')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Cancel individual user subscription')
  async cancelIndividualSubscription(@Param('userId', ValidateId) userId: number): Promise<ApiMessageData> {
    return await this.adminService.cancelIndividualSubscription(userId);
  }

  @Put('/individuals/:userId/usage/:featureName/:action')
  @AuthType('admin')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update individual user feature usage')
  async updateIndividualUsage(
    @Param('userId', ValidateId) userId: number,
    @Param('featureName') featureName: string,
    @Param('action') action: 'increment' | 'decrement' | 'reset'
  ): Promise<ApiMessageData> {
    return await this.adminService.updateIndividualUsage(userId, featureName, action);
  }
}
