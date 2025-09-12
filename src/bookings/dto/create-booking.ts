import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID del estudio donde se hará la reserva',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'El ID del estudio es obligatorio.' })
  @IsUUID('4', { message: 'El ID del estudio debe ser un UUID válido.' })
  studioId: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2025-09-03T10:00:00Z',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida.' },
  )
  startTime: Date;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2025-09-03T12:00:00Z',
  })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida.' })
  endTime: Date;

  @ApiProperty({
    description: 'ID de la room (sala) dentro del studio que se reserva',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'El ID de la sala (roomId) es obligatorio.' })
  @IsUUID('4', { message: 'El ID de la sala debe ser un UUID válido.' })
  roomId: string;

  @ApiProperty({
    description: 'IDs de los instrumentos seleccionados (opcional)',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  instrumentIds?: string[];
}
