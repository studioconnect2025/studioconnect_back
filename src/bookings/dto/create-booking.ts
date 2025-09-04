import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'El ID del estudio es obligatorio.' })
  @IsUUID('4', { message: 'El ID del estudio debe ser un UUID válido.' })
  studioId: string;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida.' })
  startTime: Date;

  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida.' })
  endTime: Date;
}
