import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Req } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { AddNoteDto, CreateSessionDto, AddTranscriptDto, PaginationUserQueryDto } from 'src/dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Sessions')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

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

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all user sessions')
  async getUserSessions(@Query() queryParams: PaginationUserQueryDto, @Req() req: Request) {
    return await this.sessionService.getUserSessions(queryParams, +req.user.id);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a user session')
  async getUserSession(@Param('id', ValidateId) sessionId: number, @Req() req: Request) {
    return await this.sessionService.getUserSession(sessionId, +req.user.id);
  }

  // ? ADMIN APIS
  // @Get('/')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get all sessions')
  // async getSessions(@Query() queryParams: PaginationUserQueryDto) {
  //   return await this.sessionService.getSessions(queryParams);
  // }

  // @Get('/:id')
  // @HttpCode(HttpStatus.OK)
  // @SwaggerApiResponse('Get a session by ID')
  // async getSession(@Param('id', ValidateId) sessionId: number) {
  //   return await this.sessionService.getSession(sessionId);
  // }
}
