import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstrumentDto {
  @ApiProperty({
    description: 'Nombre del instrumento',
    example: 'Guitarra eléctrica',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Descripción del instrumento',
    example: 'Guitarra marca Fender con pastillas dobles',
  })
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    description: 'Precio de alquiler del instrumento',
    example: 350.0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Disponibilidad del instrumento',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  available: boolean;

  @ApiProperty({
    description: 'URL de la imagen del instrumento',
    example: 'https://misfotos.com/guitarra.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  imgUrl?: string;

  @ApiProperty({
    description: 'Categoría del instrumento',
    example: 'Instrumento de cuerda',
  })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiProperty({
    description: 'ID del estudio al que pertenece el instrumento',
    example: '8f8b6e34-12ab-4c9e-b6d5-f9a123456789',
  })
  @IsUUID()
  @IsNotEmpty()
  studioId: string;
}
