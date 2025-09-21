import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { StudioStatus } from '../../studios/enum/studio-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStudioStatusDto {
  /**
   * El nuevo estado para la solicitud del estudio.
   * Solo puede ser 'Aprobado' o 'Rechazado'.
   */
  @ApiProperty({
    description: "El nuevo estado para la solicitud del estudio (Aprobado o Rechazado)",
    enum: [StudioStatus.APPROVED, StudioStatus.REJECTED],
    example: StudioStatus.APPROVED,
  })
  @IsNotEmpty()
  @IsEnum([StudioStatus.APPROVED, StudioStatus.REJECTED])
  status: StudioStatus;

  @IsString()
  @IsOptional() // Es opcional, porque solo se usa al rechazar
  @MinLength(10, { message: 'La razón del rechazo debe tener al menos 10 caracteres.' })
  rejectionReason?: string;
}
