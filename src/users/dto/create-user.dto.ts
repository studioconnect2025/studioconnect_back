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

export class UbicacionDto {
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsString() calle?: string;
  @IsOptional() @IsString() codigoPostal?: string;
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
