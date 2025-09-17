import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateInstrumentDto } from './create-instrumento.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInstrumentoDto extends PartialType(CreateInstrumentDto) {
  @ApiProperty({
    description: 'Nuevo nombre del instrumento',
    example: 'Bajo eléctrico',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Nueva descripción del instrumento',
    example: 'Ibanez de 5 cuerdas color negro',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Nuevo nombre de la categoría',
    example: 'Percusión',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryName?: string;
}
