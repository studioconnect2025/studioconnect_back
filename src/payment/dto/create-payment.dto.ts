import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsArray, ArrayUnique } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la reserva',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  bookingId: string;

  @ApiProperty({
    description: 'IDs de los instrumentos seleccionados (opcional)',
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  instrumentIds?: string[];
}
