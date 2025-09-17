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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UbicacionDto {
 @ApiPropertyOptional({ example: 'Córdoba' })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ example: 'Córdoba' })
  @IsOptional()
  @IsString()
  provincia?: string;

  @ApiPropertyOptional({ example: 'San Martín 1500' })
  @IsOptional()
  @IsString()
  calle?: string;

  @ApiPropertyOptional({ example: '5000' })
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @ApiPropertyOptional({ example: 'Argentina' })
  @IsOptional()
  @IsString()
  pais?: string;
}

export class CreateProfileDto {
  @IsOptional() @IsString() @MinLength(2) nombre?: string;
  @IsOptional() @IsString() @MinLength(2) apellido?: string;
  @IsOptional() @IsString() numeroDeTelefono?: string;

  // Forma anidada
  @IsOptional()
  @ValidateNested()
  @Type(() => UbicacionDto)
  ubicacion?: UbicacionDto;

  // Forma plana (también aceptada)
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsString() calle?: string;
  @IsOptional() @IsString() codigoPostal?: string;
  @IsOptional() @IsString() pais?: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @MinLength(8)
  confirmPassword?: string;

 
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile?: CreateProfileDto;
}
