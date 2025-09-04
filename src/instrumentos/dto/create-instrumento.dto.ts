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

export class CreateInstrumentDto {
  /**
   * @description Esta propiedad debe ser el nombre del instrumento
   * @example "guitarra electrica"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
  /**
   * @description Esta propiedad debe ser la descripción del instrumento
   * @example "Guitarra marca x y sus caracteristicas"
   */
  @IsString()
  @IsNotEmpty()
  description?: string;
  /**
   * @description Esta propiedad debe ser el precio de alquiler del instrumento
   * @example 350.0
   */
  @IsNumber()
  @Min(0)
  price: number;
  /**
   * @description Esta propiedad indica si el instrumento está disponible
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  available: boolean;
  /**
   * @description Esta propiedad debe ser la imagen del instrumento
   * @example ""
   */
  @IsString()
  @IsOptional()
  imgUrl?: string;
  /**
   * @description Esta propiedad debe ser el nombre de la categoria
   * @example "Instrumento de cuerda."
   */
  @IsString()
  @IsNotEmpty()
  categoryName: string;
  /**
   * @description Id del estudio al que pertenece el instrumento
   * @example "8f8b6e34-12ab-4c9e-b6d5-f9a123456789"
   */
  @IsUUID()
  @IsNotEmpty()
  studioId: string;
}
