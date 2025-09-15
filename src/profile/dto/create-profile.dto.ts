import { IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString() @IsOptional() nombre?: string;
  @IsString() @IsOptional() apellido?: string;
  @IsString() @IsOptional() numeroDeTelefono?: string;
  @IsString() @IsOptional() ciudad?: string;
  @IsString() @IsOptional() provincia?: string;
  @IsString() @IsOptional() calle?: string;
  @IsString() @IsOptional() codigoPostal?: string;
}