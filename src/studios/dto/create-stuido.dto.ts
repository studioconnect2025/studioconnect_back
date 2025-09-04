import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateStudioDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString({ message: 'El tipo de estudio debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de estudio es obligatorio' })
  studioType: string;

  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @IsString({ message: 'La provincia debe ser un texto' })
  @IsNotEmpty({ message: 'La provincia es obligatoria' })
  province: string;

  @IsString({ message: 'La dirección debe ser un texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  address: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  phoneNumber?: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description: string;

  @IsArray({ message: 'El equipo disponible debe ser un arreglo de textos' })
  @IsString({ each: true, message: 'Cada equipo debe ser un texto' })
  @IsOptional()
  availableEquipment?: string[];

  @IsNumber({}, { message: 'La tarifa por hora debe ser un número' })
  @Min(0, { message: 'La tarifa por hora no puede ser negativa' })
  @IsOptional()
  hourlyRate?: number;

  @IsNumber({}, { message: 'La tarifa por día debe ser un número' })
  @Min(0, { message: 'La tarifa por día no puede ser negativa' })
  @IsOptional()
  dailyRate?: number;

  @IsString({
    message: 'La hora de apertura debe ser un texto en formato HH:mm',
  })
  @IsOptional()
  openingTime?: string;

  @IsString({ message: 'La hora de cierre debe ser un texto en formato HH:mm' })
  @IsOptional()
  closingTime?: string;
}
