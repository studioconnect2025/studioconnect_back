import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StudioTypeEnum } from '../enum/studio-type.enum';
import { ServicesType } from '../enum/ServicesType.enum';

export class CreateStudioDto {
  @ApiProperty({ description: 'Nombre del estudio', example: 'Estudio Sonido Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tipo de estudio', example: 'grabacion' })
  @IsEnum(StudioTypeEnum)
  studioType: StudioTypeEnum;

  @ApiProperty({ description: 'Ciudad', example: 'Monterrey' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Provincia', example: 'Nuevo León' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ description: 'Dirección', example: 'Av. Siempre Viva 123' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Descripción del estudio', example: 'Estudio con cabina profesional', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ description: 'Servicios disponibles', isArray: true, enum: ServicesType, example: ['Sala de grabación', 'Cafetería'] })
  @IsEnum(ServicesType, { each: true })
  @IsArray()
  @IsOptional()
  services?: ServicesType[];

  @ApiProperty({ description: 'Fotos del estudio', type: 'array', items: { type: 'string', format: 'binary' }, required: false })
  @IsOptional()
  photos?: string[];

  @ApiProperty({ description: 'Registro comercial (PDF o imagen)', type: 'string', format: 'binary', required: false })
  @IsOptional()
  comercialRegister?: string;

  @ApiProperty({ description: 'Hora de apertura', example: 9 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  openingTime?: number;

  @ApiProperty({ description: 'Hora de cierre', example: 21 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  closingTime?: number;

  @ApiProperty({ description: 'Equipo disponible', isArray: true, example: ['Micrófono Shure SM7B'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];
}

