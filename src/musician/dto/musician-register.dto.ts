import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO para el objeto anidado 'ubicacion'

class UbicacionDto {
  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  ciudad: string;

  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  provincia: string;

  @ApiProperty({ example: 'Av. Corrientes 1234' })
  @IsString()
  calle: string;

  @ApiProperty({ example: 'C1043AAS' })
  @IsString()
  codigoPostal: string;

  @ApiProperty({ example: 'Argentina' })
  @IsString()
  pais: string;
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
