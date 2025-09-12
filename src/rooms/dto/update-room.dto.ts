import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUrl } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiPropertyOptional({ description: 'Actualizar solo los campos necesarios' })
  override name?: string;
}

export class UpdateImageOrderDto {
  @ApiProperty({
    description: 'Array de URLs de imágenes en el nuevo orden deseado',
    example: [
      'https://res.cloudinary.com/demo/image/upload/v1234567890/rooms/room1/image1.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1234567890/rooms/room1/image2.jpg'
    ],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  imageUrls: string[];
}

