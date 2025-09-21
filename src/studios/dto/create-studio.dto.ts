import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  IsEnum,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StudioTypeEnum } from '../enum/studio-type.enum';
import { ServicesType } from '../enum/ServicesType.enum';

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
    example: 'grabacion',
    enum: StudioTypeEnum,
  })
  @IsEnum(StudioTypeEnum)
  studioType: StudioTypeEnum;

  // Ubicación desanidada para que el servicio pueda usarla directamente
  @ApiProperty({ description: 'País', example: 'Mexico' })
  @IsString()
  @IsNotEmpty()
  pais: string;

  @ApiProperty({ description: 'Código postal', example: '54476' })
  @IsString()
  @IsNotEmpty()
  codigoPostal: string;

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

  @ApiProperty({
    description: 'Descripción del estudio',
    example: 'Estudio con cabina profesional',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Servicios disponibles',
    isArray: true,
    enum: ServicesType,
    example: ['Sala de grabación', 'Cafetería'],
  })
  @IsEnum(ServicesType, { each: true })
  @IsArray()
  @IsOptional()
  services?: ServicesType[];

  @ApiProperty({
    description: 'Fotos del estudio (máximo 5)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Solo se permiten hasta 5 fotos' })
  photos?: Express.Multer.File[];

  @ApiProperty({
    description: 'Registro comercial (PDF o imagen)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  comercialRegister?: Express.Multer.File;

  @ApiProperty({
    description: 'Hora de apertura, formato HH:MM',
    example: '09:30',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora debe tener formato HH:MM',
  })
  openingTime?: string;

  @ApiProperty({
    description: 'Hora de cierre, formato HH:MM',
    example: '21:00',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora debe tener formato HH:MM',
  })
  closingTime?: string;
}



// @ApiPropertyOptional({ description: 'Hora de apertura, formato HH:MM', example: '09:30' })
// @IsOptional()
// @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe tener formato HH:MM' })
// openingTime?: string;

// @ApiPropertyOptional({ description: 'Hora de cierre, formato HH:MM', example: '21:00' })
// @IsOptional()
// @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe tener formato HH:MM' })
// closingTime?: string;
