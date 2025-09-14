import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class ReprogramBookingDto {
  @ApiProperty({
    description: 'Nueva fecha de inicio',
    example: '2025-09-05T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  newStartTime: Date;

  @ApiProperty({
    description: 'Nueva fecha de fin',
    example: '2025-09-05T12:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  newEndTime: Date;

  @ApiProperty({
    description: 'ID de la sala a reprogramar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  roomId: string;
}
