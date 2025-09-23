import {
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
  IsEnum,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudioStatus } from '../enum/studio-status.enum';
import { StudioTypeEnum } from '../enum/studio-type.enum';
import { ServicesType } from '../enum/ServicesType.enum';
import { Transform } from 'class-transformer'; // <--- 1. IMPORTAR TRANSFORM

export class UpdateStudioDto {
  @ApiPropertyOptional({ description: 'Nombre del estudio', example: 'Estudio Actualizado' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Tipo de estudio', enum: StudioTypeEnum, example: 'grabacion' })
  @IsEnum(StudioTypeEnum)
  @IsOptional()
  studioType?: StudioTypeEnum;

  @ApiPropertyOptional({ description: 'Pais', example: 'Mexico' })
  @IsString()
  @IsOptional()
  pais?: string;

  @ApiPropertyOptional({ description: 'Codigo Postal', example: '54476' })
  @IsString()
  @IsOptional()
  codigoPostal?: string;

  @ApiPropertyOptional({ description: 'Ciudad', example: 'Guadalajara' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Provincia', example: 'Jalisco' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ description: 'Dirección', example: 'Calle Nueva 456' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Teléfono', example: '+52 3312345678' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'nuevo@estudio.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Descripción del estudio', example: 'Nueva descripción del estudio', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Servicios disponibles', isArray: true, enum: ServicesType, example: ['Sala de grabación', 'Cafetería'] })
  @IsEnum(ServicesType, { each: true })
  @IsArray()
  @IsOptional()
  // <--- 2. AÑADIR EL DECORADOR @Transform
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  services?: ServicesType[];

  @ApiPropertyOptional({ description: 'Fotos del estudio (máximo 5)', type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Solo se permiten hasta 5 fotos' })
  photos?: Express.Multer.File[];

  @ApiPropertyOptional({ description: 'Registro comercial (PDF o imagen)', type: 'string', format: 'binary', required: false })
  @IsOptional()
  comercialRegister?: Express.Multer.File;

  @ApiPropertyOptional({ description: 'Hora de apertura, formato HH:MM', example: '09:30' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe tener formato HH:MM' })
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ description: 'Hora de cierre, formato HH:MM', example: '21:00' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe tener formato HH:MM' })
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional({ description: 'Estado del estudio', example: 'approved', enum: StudioStatus })
  @IsEnum(StudioStatus)
  @IsOptional()
  status?: StudioStatus;
}