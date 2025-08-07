import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData, PermissionEnum } from '@types';
import { CreatePatientDto, GetPatientsDto, UpdatePatientDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';
import { Request } from 'express';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Patient')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new patient')
  @Permissions(PermissionEnum.CREATE_PATIENT)
  async createPatient(@Body() reqBody: CreatePatientDto, @Req() req: Request): Promise<ApiMessageData> {
    return await this.patientService.createPatient(reqBody, +req.user.id);
  }

  @Put('/:id')
  @Permissions(PermissionEnum.CREATE_PATIENT)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update patient')
  async updatePatient(@Param('id', ValidateId) patientId: number, @Body() reqBody: UpdatePatientDto) {
    return await this.patientService.updatePatient(patientId, reqBody);
  }

  @Get('/by-appointment')
  @Permissions(PermissionEnum.VIEW_PATIENT)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all patient')
  async getPatientsByAppointment(@Query() queryParams: GetPatientsDto, @Req() req: Request) {
    return await this.patientService.getPatientsByAppointment(queryParams, +req.user.id);
  }

  @Get('/')
  @Permissions(PermissionEnum.VIEW_ALL_PATIENTS, PermissionEnum.VIEW_PATIENT)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all patient')
  async getPatients(@Query() queryParams: GetPatientsDto, @Req() req: Request) {
    return await this.patientService.getPatients(queryParams, +req.user.id);
  }

  @Get('/:id')
  @Permissions(PermissionEnum.VIEW_ALL_PATIENTS, PermissionEnum.VIEW_PATIENT)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a patient by ID')
  async getPatient(@Param('id', ValidateId) patientId: number, @Req() req: Request) {
    return await this.patientService.getPatient(patientId, +req.user.id);
  }

  @Delete('/:id')
  @Permissions(PermissionEnum.VIEW_PATIENT)
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a patient by ID')
  async deletePatient(@Param('id', ValidateId) patientId: number, @Req() req: Request) {
    return await this.patientService.deletePatient(patientId, +req.user.id);
  }
}
