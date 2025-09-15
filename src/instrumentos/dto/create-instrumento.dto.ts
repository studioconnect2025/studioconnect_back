import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInstrumentDto {
  @ApiProperty({
    description: 'Nombre del instrumento',
    example: 'Guitarra eléctrica',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  name: string;

  @MaxLength(255)
  @ApiProperty({
    description: 'Descripción del instrumento',
    example: 'Guitarra marca Fender con pastillas dobles',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Precio de alquiler del instrumento',
    example: 350.0,
  })
  @Type(() => Number)
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
    description: 'Categoría del instrumento',
    example: 'Instrumento de cuerda',
  })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiProperty({
    description: 'ID de la sala al que pertenece el instrumento',
    example: '8f8b6e34-12ab-4c9e-b6d5-f9a123456789',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}
