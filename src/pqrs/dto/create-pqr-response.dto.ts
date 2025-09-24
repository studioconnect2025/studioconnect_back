import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePqrResponseDto {

  @ApiProperty({
    description: 'El contenido o mensaje de la respuesta a la PQR.',
    example: 'Hemos recibido su reclamo y se le contactará en breve para resolver su problema.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}