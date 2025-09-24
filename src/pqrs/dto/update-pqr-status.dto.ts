import { IsEnum, IsNotEmpty } from 'class-validator';
import { PqrStatus } from '../entities/pqr.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePqrStatusDto {

  @ApiProperty({
    description: 'El nuevo estado de la PQR.',
    enum: PqrStatus,
    example: PqrStatus.IN_PROGRESS, // Asegúrate de usar un valor válido de tu enum
  })
  @IsEnum(PqrStatus)
  @IsNotEmpty()
  status: PqrStatus;
}