import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Req, UploadedFile } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData, ApiMessageDataPagination, PermissionEnum } from '@types';
import { AddNoteDto, CreateSessionDto, AddTranscriptDto, GetSessionsDto, UpdateSessionDto, AddSessionDetailsDto, CreateSessionFeedbackDto, PaginationQueryDto } from 'src/dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { FileUpload, SwaggerApiResponse } from '@decorators';
import { Request } from 'express';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new session')
  async createSession(@Body() reqBody: CreateSessionDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.sessionService.createSession(reqBody, +req.user.id);
  }

  @Put('/details/:id')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.CREATED)
  @FileUpload('sessionAudio')
  @SwaggerApiResponse('Create a new session')
  async updateSessionDetails(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddSessionDetailsDto, @Req() req: Request, @UploadedFile() audioFile: Express.Multer.File): Promise<ApiMessageData> {
    return await this.sessionService.updateSessionDetails(sessionId, reqBody, audioFile);
  }

  @Put('/:id')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async updateSessionStatus(@Param('id', ValidateId) sessionId: number, @Body() updateSessionDto: UpdateSessionDto, @Req() req: Request) {
    return await this.sessionService.updateSessionStatus(sessionId, updateSessionDto, +req.user.id);
  }

  @Put('/:id/note')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add a note to a session')
  async addNoteToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addNoteToSession(sessionId, reqBody);
  }

  @Put('/:id/audio-file')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @FileUpload('audioFile')
  @SwaggerApiResponse('Upload session audio file')
  async uploadSessionAudio(@Param('id', ValidateId) sessionId: number, @UploadedFile() audioFile: Express.Multer.File) {
    return await this.sessionService.uploadSessionAudio(sessionId, audioFile);
  }

  @Put('/:id/transcript')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add transcript to a session')
  async addTranscriptToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddTranscriptDto) {
    return await this.sessionService.addTranscriptToSession(sessionId, reqBody);
  }

  @Put('/:id/doctor-note')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add a doctor note to a session')
  async addDoctorNotesToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addDoctorNotesToSession(sessionId, reqBody);
  }

  @Put('/:id/diagnosis-codes')
  @Permissions(PermissionEnum.CREATE_PATIENT_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add diagnosis codes to a session')
  async addDiagnosisCodes(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addDiagnosisCodes(sessionId, reqBody);
  }

  @Get('/')
  @Permissions(PermissionEnum.VIEW_ALL_SESSIONS, PermissionEnum.VIEW_SESSION)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all user sessions')
  async getUserSessions(@Query() queryParams: GetSessionsDto, @Req() req: Request) {
    return await this.sessionService.getSessions(queryParams, +req.user.id);
  }

  @Get('/:id')
  @Permissions(PermissionEnum.VIEW_SESSION, PermissionEnum.VIEW_ALL_SESSIONS)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUserSession(@Param('id', ValidateId) sessionId: number, @Req() req: Request) {
    return await this.sessionService.getSession(sessionId, +req.user.id);
  }

  @Post('/:id/feedback')
  @Permissions(PermissionEnum.CREATE_SESSION_FEEDBACK)
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Submit feedback for a session')
  async createSessionFeedback(
    @Param('id', ValidateId) sessionId: number, 
    @Body() reqBody: CreateSessionFeedbackDto,
    @Req() req: Request
  ): Promise<ApiMessageData> {
    return await this.sessionService.createSessionFeedback(sessionId, reqBody, +req.user.id);
  }

  @Get('/:id/feedback')
  @Permissions(PermissionEnum.VIEW_SESSION_FEEDBACK)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all feedbacks for a session')
  async getSessionFeedbacks(
    @Param('id', ValidateId) sessionId: number,
    @Query() queryParams: PaginationQueryDto,
    @Req() req: Request
  ): Promise<ApiMessageDataPagination> {
    return await this.sessionService.getSessionFeedbacks(sessionId, +req.user.id, queryParams);
  }
}
