import { IsArray, IsEnum, IsString, MinLength } from 'class-validator';

// Usamos un Enum para limitar las opciones del nivel de experiencia
export enum NivelExperiencia {
  PRINCIPIANTE = 'Principiante',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado',
  PROFESIONAL = 'Profesional',
}

export class PerfilMusicalDto {
  @IsString()
  @MinLength(3)
  rolPrincipal: string;

  @IsArray()
  @IsString({ each: true })
  generosMusicales: string[];

  @IsArray()
  @IsString({ each: true })
  instrumentosHabilidades: string[];

  @IsEnum(NivelExperiencia)
  nivelDeExperiencia: NivelExperiencia;
}