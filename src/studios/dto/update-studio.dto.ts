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
import { StudioStatus } from '../enum/studio-status.enum';

export class UpdateStudioDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El tipo de estudio debe ser un texto' })
  @IsOptional()
  studioType?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(500, { message: 'La descripción no puede tener más de 500 caracteres' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'Los equipos disponibles deben ser un arreglo de strings' })
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyRate?: number;

  @IsString()
  @IsOptional()
  openingTime?: string;

  @IsString()
  @IsOptional()
  closingTime?: string;

  @IsEnum(StudioStatus, { message: 'El estado debe ser: approved, pending o rejected' })
  @IsOptional()
  status?: StudioStatus;
}
