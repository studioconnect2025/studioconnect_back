import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PqrType } from '../entities/pqr.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePqrDto {

  @ApiProperty({
    description: 'Asunto o título breve de la PQR.',
    example: 'Problema con la reserva',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

   @ApiProperty({
    description: 'Descripción detallada de la queja, petición o reclamo.',
    example: 'El estudio de grabación no tenía el equipo prometido.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
      description: 'Tipo de PQR (Petición, Queja o Reclamo).',
      enum: PqrType,
      example: PqrType.CLAIM,
    })
  @IsEnum(PqrType)
  @IsNotEmpty()
  type: PqrType;

   @ApiPropertyOptional({
    description: 'ID del usuario sobre el cual se reporta la PQR.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  reportedUserId?: string;

  // ✅ Líneas agregadas para solucionar el error
  @ApiPropertyOptional({
    description: 'ID de la reserva a la que está asociada la PQR.',
    example: 'a1b2c3d4-e5f6-7g8h-i9j0-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  bookingId?: string; // Opcional, para asociar la PQR a una reserva
}