import { IsString, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para el objeto anidado 'profile' aplanado
class UpdateProfileDto {
  @IsString() @MinLength(2) @IsOptional()
  nombre?: string;

  @IsString() @MinLength(2) @IsOptional()
  apellido?: string;

  @IsString() @IsOptional()
  numeroDeTelefono?: string;

  @IsString() @IsOptional()
  ciudad?: string;

  @IsString() @IsOptional()
  provincia?: string;

  @IsString() @IsOptional()
  calle?: string;

  @IsString() @IsOptional()
  codigoPostal?: string;
}

export class UpdateMusicianProfileDto {
  @Type(() => UpdateProfileDto)
  @IsOptional()
  profile?: UpdateProfileDto;
}