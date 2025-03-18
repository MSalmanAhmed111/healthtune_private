import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Req, UploadedFile } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { AddNoteDto, CreateSessionDto, AddTranscriptDto, GetSessionStatsDto, GetSessionsDto } from 'src/dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { FileUpload, SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('/stats')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get session stats')
  async getSessionStats(@Query() queryParams: GetSessionStatsDto) {
    return await this.sessionService.getSessionStats(queryParams, queryParams.userId);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new session')
  async createSession(@Body() reqBody: CreateSessionDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.sessionService.createSession(reqBody, +req.user.id);
  }

  @Put('/:id/note')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add a note to a session')
  async addNoteToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addNoteToSession(sessionId, reqBody);
  }

  @Put('/:id/audio-file')
  @HttpCode(HttpStatus.OK)
  @FileUpload('audioFile')
  @SwaggerApiResponse('Upload session audio file')
  async uploadSessionAudio(@Param('id', ValidateId) sessionId: number, @UploadedFile() audioFile: Express.Multer.File) {
    return await this.sessionService.uploadSessionAudio(sessionId, audioFile);
  }

  @Put('/:id/transcript')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add transcript to a session')
  async addTranscriptToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddTranscriptDto) {
    return await this.sessionService.addTranscriptToSession(sessionId, reqBody);
  }

  @Put('/:id/doctor-note')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add a doctor note to a session')
  async addDoctorNotesToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addDoctorNotesToSession(sessionId, reqBody);
  }

  @Put('/:id/diagnosis-codes')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add diagnosis codes to a session')
  async addDiagnosisCodes(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addDiagnosisCodes(sessionId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all user sessions')
  async getUserSessions(@Query() queryParams: GetSessionsDto, @Req() req: Request) {
    return await this.sessionService.getSessions(queryParams, +req.user.id);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUserSession(@Param('id', ValidateId) sessionId: number, @Req() req: Request) {
    return await this.sessionService.getSession(sessionId, +req.user.id);
  }
}
