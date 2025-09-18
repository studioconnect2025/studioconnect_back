import { IsEnum, IsNotEmpty } from 'class-validator';
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
}
