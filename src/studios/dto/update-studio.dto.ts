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
import { StudioTypeEnum } from '../enum/studio-type.enum';
import { ServicesType } from '../enum/ServicesType.enum';

export class UpdateStudioDto {
  @ApiPropertyOptional({ description: 'Nombre del estudio', example: 'Estudio Actualizado' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Tipo de estudio', enum: StudioTypeEnum, example: 'grabacion' })
  @IsEnum(StudioTypeEnum)
  @IsOptional()
  studioType?: StudioTypeEnum;

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

  @ApiPropertyOptional({ description: 'Servicios disponibles', isArray: true, enum: ServicesType, example: ['Sala de grabación', 'Cafetería'] })
  @IsEnum(ServicesType, { each: true })
  @IsArray()
  @IsOptional()
  services?: ServicesType[];

  @ApiPropertyOptional({ description: 'Fotos del estudio', type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ description: 'Registro comercial (PDF o imagen)', type: 'string', format: 'binary', required: false })
  @IsOptional()
  comercialRegister?: string;

  @ApiPropertyOptional({ description: 'Equipo disponible actualizado', example: ['Micrófono Neumann', 'Batería Pearl'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @ApiPropertyOptional({ description: 'Hora de apertura', example: 8 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  openingTime?: number;

  @ApiPropertyOptional({ description: 'Hora de cierre', example: 22 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  closingTime?: number;

  @ApiPropertyOptional({ description: 'Estado del estudio', example: 'approved', enum: StudioStatus })
  @IsEnum(StudioStatus)
  @IsOptional()
  status?: StudioStatus;
}

