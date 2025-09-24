import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from 'src/auth/enum/roles.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UbicacionDto {
  @ApiPropertyOptional({ description: 'Ciudad donde se encuentra el usuario.', example: 'Córdoba' })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ description: 'Provincia del usuario.', example: 'Córdoba' })
  @IsOptional()
  @IsString()
  provincia?: string;

  @ApiPropertyOptional({ description: 'Calle y número de la dirección.', example: 'San Martín 1500' })
  @IsOptional()
  @IsString()
  calle?: string;

  @ApiPropertyOptional({ description: 'Código postal de la ubicación.', example: '5000' })
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @ApiPropertyOptional({ description: 'País del usuario.', example: 'Argentina' })
  @IsOptional()
  @IsString()
  pais?: string;
}

export class CreateProfileDto {
  @ApiPropertyOptional({ description: 'Nombre del usuario.', example: 'Juan' }) @IsOptional() @IsString() @MinLength(2) nombre?: string;
  @ApiPropertyOptional({ description: 'Apellido del usuario.', example: 'Pérez' }) @IsOptional() @IsString() @MinLength(2) apellido?: string;
  @ApiPropertyOptional({ description: 'Número de teléfono del usuario.', example: '+5493511234567' }) @IsOptional() @IsString() numeroDeTelefono?: string;

  // Forma anidada
  @ApiPropertyOptional({
    description: 'Información de la ubicación del usuario.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UbicacionDto)
  ubicacion?: UbicacionDto;

  // Forma plana (también aceptada)
  @ApiPropertyOptional({ description: 'Ciudad donde se encuentra el usuario.', example: 'Córdoba' }) @IsOptional() @IsString() ciudad?: string;
  @ApiPropertyOptional({ description: 'Provincia del usuario.', example: 'Córdoba' }) @IsOptional() @IsString() provincia?: string;
  @ApiPropertyOptional({ description: 'Calle y número de la dirección.', example: 'San Martín 1500' }) @IsOptional() @IsString() calle?: string;
  @ApiPropertyOptional({ description: 'Código postal de la ubicación.', example: '5000' }) @IsOptional() @IsString() codigoPostal?: string;
  @ApiPropertyOptional({ description: 'País del usuario.', example: 'Argentina' }) @IsOptional() @IsString() pais?: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 8 caracteres).',
    example: 'password123',
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Confirmación de la contraseña.',
    example: 'password123',
  })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(8)
  confirmPassword?: string;

  @ApiPropertyOptional({ description: 'Rol del usuario.' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Información de perfil del usuario.', })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile?: CreateProfileDto;
}
