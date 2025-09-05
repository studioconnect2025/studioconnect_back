import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID, ArrayNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tipo de sala' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Capacidad de personas' })
  @IsNumber()
  capacity: number;

  @ApiProperty({ description: 'Tamaño en m²' })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'Precio por hora', minimum: 0 })
  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @ApiProperty({ description: 'Horas mínimas de reserva' })
  @IsNumber()
  minHours: number;

  @ApiPropertyOptional({ description: 'Descripción de la sala' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'IDs de los instrumentos disponibles', type: [String] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Debes seleccionar al menos un instrumento' })
  @IsUUID('4', { each: true, message: 'Cada instrumento debe ser un UUID válido' })
  instrumentIds: string[];

  @ApiPropertyOptional({ description: 'Equipo adicional personalizado' })
  @IsOptional()
  @IsString()
  customEquipment?: string;

  @ApiPropertyOptional({ description: 'Disponibilidad de la sala' })
  @IsOptional()
  availability?: any;
}

