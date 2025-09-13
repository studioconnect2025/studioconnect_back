// src/users/dto/create-user.dto.ts
import { IsEmail, IsEnum, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../auth/enum/roles.enum';

import { PreferenciasDto } from '../../musician/dto/preferencias.dto';

// DTO para el objeto anidado 'profile'
class ProfileDto {
  @IsString() @MinLength(2) nombre: string;
  @IsString() @MinLength(2) apellido: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;
  
  @IsEnum(UserRole)
  role: UserRole; // Para definir si es MUSICIAN o STUDIO_OWNER

  // El perfil será opcional (?): puede que un dueño se registre sin él
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto; 
}