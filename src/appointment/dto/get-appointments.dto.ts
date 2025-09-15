import { Trim } from '@decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, SortEnum } from '@types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '@dtos';

export class GetAppointmentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Search query for patient name, doctor name, or reason for visit' })
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  @ApiPropertyOptional({ description: 'Filter by Doctor ID' })
  doctorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsPositive()
  @ApiPropertyOptional({ description: 'Filter by Patient ID' })
  patientId?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  @ApiPropertyOptional({ description: 'Filter by Appointment Status', enum: AppointmentStatus })
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by appointment type (e.g., Consultation, Follow-up, Exam)' })
  appointmentType?: string;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by payment status (e.g., Pending, Paid, Insurance Covered)' })
  paymentStatus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({ description: 'Minimum consultation fee filter' })
  minConsultationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({ description: 'Maximum consultation fee filter' })
  maxConsultationFee?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @ApiPropertyOptional({ description: 'Filter by telemedicine appointments (true/false)' })
  isTelemedicine?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @ApiPropertyOptional({ description: 'Filter by completed appointments (true/false)' })
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  @Trim()
  @ApiPropertyOptional({ description: 'Filter by appointment location (Clinic, Online, Home Visit)' })
  location?: string;

  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by appointments on or after this start date' })
  startDate?: Date;

  @IsOptional()
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by appointments on or before this end date' })
  endDate?: Date;

  @IsOptional()
  @IsString()
  @Trim()
  @IsEnum(SortEnum)
  @ApiPropertyOptional({ description: 'Sort order by created date ascending or descending' })
  sort?: SortEnum.ASC | SortEnum.DESC;
}
