import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StudioType } from '../enum/studio-type.enum';

export class CreateStudioDto {
  @ApiProperty({
    description: 'Nombre del estudio',
    example: 'Estudio Sonido Pro',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Tipo de estudio',
    example: 'El tipo de estudio debe ser grabacion, ensayo o produccion',
  })
  @IsEnum(StudioType, {
    message: 'El tipo de estudio debe ser grabacion, ensayo o produccion',
  })
  studioType: StudioType;

  @ApiProperty({
    description: 'Ciudad donde se ubica el estudio',
    example: 'Monterrey',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Provincia o estado del estudio',
    example: 'Nuevo León',
  })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({
    description: 'Dirección del estudio',
    example: 'Av. Siempre Viva 123',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+52 8112345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Correo de contacto',
    example: 'contacto@estudiopro.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Descripción del estudio',
    example: 'Estudio con cabina profesional y acústica optimizada',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Equipo disponible en el estudio',
    example: ['Consola Yamaha', 'Micrófono Shure SM7B'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @ApiProperty({
    description: 'Tarifa por hora',
    example: 200,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiProperty({
    description: 'Tarifa por día',
    example: 1500,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyRate?: number;

  @ApiProperty({
    description: 'Hora de apertura (HH:mm)',
    example: '09:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiProperty({
    description: 'Hora de cierre (HH:mm)',
    example: '21:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  closingTime?: string;
}
