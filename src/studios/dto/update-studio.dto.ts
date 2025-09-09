import {
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudioStatus } from '../enum/studio-status.enum';

export class UpdateStudioDto {
  @ApiPropertyOptional({ description: 'Nombre del estudio', example: 'Estudio Actualizado' })
  @IsString()
  @IsOptional()
  name?: string;


  @ApiPropertyOptional({ description: 'Ciudad del estudio', example: 'Guadalajara' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Provincia del estudio', example: 'Jalisco' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ description: 'Dirección del estudio', example: 'Calle Nueva 456' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+52 3312345678' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'nuevo@estudio.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Descripción del estudio', example: 'Nueva descripción del estudio' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Equipo disponible actualizado',
    example: ['Micrófono Neumann', 'Batería Pearl'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @ApiPropertyOptional({ description: 'Tarifa por hora', example: 250 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Tarifa por día', example: 1800 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Hora de apertura', example: '08:00' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ description: 'Hora de cierre', example: '22:00' })
  @IsString()
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional({
    description: 'Estado del estudio',
    example: 'approved',
    enum: StudioStatus,
  })
  @IsEnum(StudioStatus)
  @IsOptional()
  status?: StudioStatus;
}
