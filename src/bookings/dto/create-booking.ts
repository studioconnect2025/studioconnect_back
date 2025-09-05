import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';
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
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida.' })
  startTime: Date;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2025-09-03T12:00:00Z',
  })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida.' })
  endTime: Date;
}
