import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @ApiPropertyOptional({ description: 'El nombre de la persona.', example: 'Juan', }) @IsString() @IsOptional() nombre?: string;
  @ApiPropertyOptional({ description: 'El apellido de la persona.', example: 'Pérez', }) @IsString() @IsOptional() apellido?: string;
  @ApiPropertyOptional({ description: 'El número de teléfono de contacto.', example: '+521234567890', }) @IsString() @IsOptional() numeroDeTelefono?: string;
  @ApiPropertyOptional({ description: 'La ciudad de residencia.', example: 'Ciudad de Cordobá', }) @IsString() @IsOptional() ciudad?: string;
  @ApiPropertyOptional({ description: 'La provincia o estado de residencia.', example: 'Cordobá', }) @IsString() @IsOptional() provincia?: string;
  @ApiPropertyOptional({ description: 'La dirección de la calle.', example: 'Avenida Siempre Viva 742', }) @IsString() @IsOptional() calle?: string;
  @ApiPropertyOptional({ description: 'El código postal de la dirección.', example: 'X5000', }) @IsString() @IsOptional() codigoPostal?: string;
  @ApiPropertyOptional({ description: 'El país de residencia.', example: 'Argentina', }) @IsString() @IsOptional() pais?: string;
}