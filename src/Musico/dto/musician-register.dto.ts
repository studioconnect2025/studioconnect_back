import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para el objeto anidado 'ubicacion'
class UbicacionDto {
  @IsString()
  ciudad: string;

  @IsString()
  provincia: string;

  @IsString()
  calle: string;

  @IsString()
  codigoPostal: string;
}

// DTO para el objeto anidado 'profile'
class MusicianProfileDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @MinLength(2)
  apellido: string;

  @IsString()
  numeroDeTelefono: string;

  @ValidateNested()
  @Type(() => UbicacionDto)
  ubicacion: UbicacionDto;
}

export class MusicianRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ValidateNested()
  @Type(() => MusicianProfileDto)
  profile: MusicianProfileDto;
}
