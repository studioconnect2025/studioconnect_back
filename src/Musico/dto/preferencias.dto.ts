import { IsNumber, IsPositive, IsString } from 'class-validator';

export class PreferenciasDto {
  @IsString()
  ciudad: string;

  @IsString()
  provincia: string;

  @IsString()
  pais: string;

  @IsNumber()
  @IsPositive()
  distanciaDeEstudioPreferida: number; // Por ejemplo, en kilómetros
}