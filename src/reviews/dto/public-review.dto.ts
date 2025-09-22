// dto/public-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PublicReviewDto {
  @ApiProperty({ description: 'Calificación de 1 a 5' })
  rating: number;

  @ApiProperty({ description: 'Comentario de la reseña' })
  comment: string;

  @ApiProperty({ description: 'Nombre del músico' })
  musicianName: string;

  @ApiProperty({ description: 'URL de la foto del músico', nullable: true })
  musicianAvatar?: string;

  @ApiProperty({ description: 'Nombre de la sala o estudio' })
  roomName: string;
}
