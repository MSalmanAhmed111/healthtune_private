import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreatePatientDto, GetPatientsDto, UpdatePatientDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';

@ApiTags('Patient')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new patient')
  async createPatient(@Body() reqBody: CreatePatientDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.patientService.createPatient(reqBody, +req.user.id);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update patient')
  async updatePatient(@Param('id', ValidateId) patientId: number, @Body() reqBody: UpdatePatientDto) {
    return await this.patientService.updatePatient(patientId, reqBody);
  }

  @Get('/by-appointment')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all patient')
  async getPatientsByAppointment(@Query() queryParams: GetPatientsDto, @Req() req: Request) {
    return await this.patientService.getPatientsByAppointment(queryParams, +req.user.id);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all patient')
  async getPatients(@Query() queryParams: GetPatientsDto, @Req() req: Request) {
    return await this.patientService.getPatients(queryParams, +req.user.id);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a patient by ID')
  async getPatient(@Param('id', ValidateId) patientId: number, @Req() req: Request) {
    return await this.patientService.getPatient(patientId, +req.user.id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a patient by ID')
  async deletePatient(@Param('id', ValidateId) patientId: number, @Req() req: Request) {
    return await this.patientService.deletePatient(patientId, +req.user.id);
  }
}
