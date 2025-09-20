import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 5,
    description: 'Calificación de la sala (1 a 5 estrellas)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Excelente sala, muy buen sonido y trato profesional.',
    description: 'Comentario opcional sobre la experiencia en la sala',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
