import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Put, Query, Delete } from '@nestjs/common';
import { PatientService } from './patient.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiMessageData } from '@types';
import { CreatePatientDto, GetPatientsDto, PaginationQueryDto, UpdatePatientDto } from '@dtos';
import { ValidateId } from '@pipes/validate-id.pipe';
import { SwaggerApiResponse } from '@decorators';

@ApiTags('Patient')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse('Create a new patient')
  async createPatient(@Body() reqBody: CreatePatientDto): Promise<ApiMessageData> {
    return await this.patientService.createPatient(reqBody);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Update patient')
  async updatePatient(@Param('id', ValidateId) patientId: number, @Body() reqBody: UpdatePatientDto) {
    return await this.patientService.updatePatient(patientId, reqBody);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get all patient')
  async getPatients(@Query() queryParams: GetPatientsDto) {
    return await this.patientService.getPatients(queryParams);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Get a patient by ID')
  async getPatient(@Param('id', ValidateId) patientId: number) {
    return await this.patientService.getPatient(patientId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse('Delete a patient by ID')
  async deletePatient(@Param('id', ValidateId) patientId: number) {
    return await this.patientService.deletePatient(patientId);
  }
}
