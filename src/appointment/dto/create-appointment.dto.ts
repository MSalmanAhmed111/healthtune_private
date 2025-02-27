import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Trim } from '@decorators';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @ApiProperty({ example: '123', description: 'ID of the patient' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId: number;

  @ApiProperty({ example: '456', description: 'ID of the doctor' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId: number;

  @ApiProperty({ example: '2024-02-20T10:30:00.000Z', description: 'Appointment date and time (ISO 8601 format)' })
  @IsNotEmpty()
  @Trim()
  @Type(() => Date)
  @IsDate()
  appointmentDate: Date;

  @ApiPropertyOptional({ example: 'Consultation', description: 'Type of appointment (e.g., Consultation, Follow-up, Physical Exam)' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  appointmentType?: string;

  @ApiPropertyOptional({ example: 50.0, description: 'Consultation fee in USD' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Clinic', description: 'Appointment location (Clinic, Online, Home Visit)' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional({ example: true, description: 'Indicates if the appointment is virtual (Telemedicine)' })
  @IsOptional()
  @IsBoolean()
  isTelemedicine?: boolean;

  @ApiPropertyOptional({ example: 'Room 203', description: 'Room number for in-person visits' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Follow-up appointment for back pain.', description: 'Reason for visit or additional notes' })
  @IsOptional()
  @IsString()
  @Trim()
  @IsNotEmpty()
  notes?: string;
}
