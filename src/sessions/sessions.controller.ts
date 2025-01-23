import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query } from '@nestjs/common';
import { SessionService } from './sessions.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { AddNoteDto, CreateSessionDto, AddTranscriptDto, PaginationQueryDto } from 'src/dto';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('session')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new session', CreateSessionDto)
  async createSession(@Body() reqBody: CreateSessionDto): Promise<ApiMessageData> {
    return await this.sessionService.createSession(reqBody);
  }

  @Put('/:id/note')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add a note to a session', AddNoteDto)
  async addNoteToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddNoteDto) {
    return await this.sessionService.addNoteToSession(sessionId, reqBody);
  }

  @Put('/:id/transcript')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Add transcript to a session', AddTranscriptDto)
  async addTranscriptToSession(@Param('id', ValidateId) sessionId: number, @Body() reqBody: AddTranscriptDto) {
    return await this.sessionService.addTranscriptToSession(sessionId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all sessions')
  async getSessions(@Query() queryParams: PaginationQueryDto) {
    return await this.sessionService.getSessions(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a session by ID', undefined, { id: 'string' })
  async getSession(@Param('id', ValidateId) sessionId: number) {
    return await this.sessionService.getSession(sessionId);
  }
}
