import { IsEmail, IsEnum, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PerfilMusicalDto } from './perfil-musical.dto'; // Reutilizamos los DTOs del perfil
import { PreferenciasDto } from './preferencias.dto';

// Este DTO anidado representa el objeto 'profile' para un músico
class MusicianProfileDto {
  @IsString() @MinLength(2)
  nombre: string;

  @IsString() @MinLength(2)
  apellido: string;

  @ValidateNested() @Type(() => PerfilMusicalDto)
  perfilMusical: PerfilMusicalDto;

  @ValidateNested() @Type(() => PreferenciasDto)
  preferencias: PreferenciasDto;
}

export class MusicianRegisterDto {
  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;

  @IsString() @MinLength(8)
  confirmPassword: string;

  @ValidateNested() @Type(() => MusicianProfileDto)
  profile: MusicianProfileDto;
}