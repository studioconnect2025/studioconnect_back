import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileuploadService: FileUploadService,
  ) {}

  async create(
    dto: CreateRoomDto,
    user: User,
    studioId: string,
  ): Promise<Room> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['owner'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException(
        'No puedes crear salas en un estudio que no es tuyo',
      );
    }

    const room = this.roomRepository.create({
      ...dto,
      studio,
      imageUrls: [],
      imagePublicIds: [],
    });

    return this.roomRepository.save(room);
  }

  async update(roomId: string, dto: UpdateRoomDto, user: User): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['studio', 'studio.owner'],
    });

    if (!room) throw new NotFoundException('Sala no encontrada');
    if (room.studio.owner.id !== user.id) {
      throw new ForbiddenException('No puedes editar una sala que no es tuya');
    }

    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(roomId: string, user: User): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['studio', 'studio.owner'],
    });

    if (!room) throw new NotFoundException('Sala no encontrada');
    if (room.studio.owner.id !== user.id) {
      throw new ForbiddenException('No puedes borrar una sala que no es tuya');
    }

    // Eliminar imágenes de Cloudinary antes de borrar la sala
    if (room.imagePublicIds && room.imagePublicIds.length > 0) {
      // await this.deleteImagesFromCloudinary(room.imagePublicIds);
    }

    await this.roomRepository.remove(room);
  }

  async findRoomsByStudio(studioId: string): Promise<Room[]> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['rooms'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    return studio.rooms;
  }

  // Métodos para manejo de imágenes
  async uploadImages(
    roomId: string,
    files: Express.Multer.File[],
    user: User,
  ): Promise<Room> {
    const room = await this.findRoomWithValidation(roomId, user);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    // Validar que no excedan el límite de imágenes (ej: 5 imágenes máximo)
    const currentImageCount = room.imageUrls?.length || 0;
    const maxImages = 5;
    
    if (currentImageCount + files.length > maxImages) {
      throw new BadRequestException(
        `No puedes subir más de ${maxImages} imágenes por sala`,
      );
    }

    try {
      // Subir imágenes a Cloudinary
      const uploadPromises = files.map(file =>
        // this.cloudinaryService.uploadImage(file, `rooms/${roomId}`)
        // Por ahora simularemos la respuesta de Cloudinary
        Promise.resolve({
          secure_url: `https://res.cloudinary.com/demo/image/upload/rooms/${roomId}/${file.originalname}`,
          public_id: `rooms/${roomId}/${Date.now()}_${file.originalname}`,
        })
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Actualizar la sala con las nuevas URLs e IDs
      const newImageUrls = uploadResults.map(result => result.secure_url);
      const newPublicIds = uploadResults.map(result => result.public_id);

      room.imageUrls = [...(room.imageUrls || []), ...newImageUrls];
      room.imagePublicIds = [...(room.imagePublicIds || []), ...newPublicIds];

      return await this.roomRepository.save(room);
    } catch (error) {
      throw new BadRequestException('Error al subir las imágenes');
    }
  }

  async deleteImage(
    roomId: string,
    imageIndex: number,
    user: User,
  ): Promise<Room> {
    const room = await this.findRoomWithValidation(roomId, user);

    if (!room.imageUrls || !room.imagePublicIds) {
      throw new NotFoundException('La sala no tiene imágenes');
    }

    if (imageIndex < 0 || imageIndex >= room.imageUrls.length) {
      throw new BadRequestException('Índice de imagen inválido');
    }

    const publicIdToDelete = room.imagePublicIds[imageIndex];

    try {
      // Eliminar de Cloudinary
      // await this.cloudinaryService.deleteImage(publicIdToDelete);

      // Remover de los arrays
      room.imageUrls.splice(imageIndex, 1);
      room.imagePublicIds.splice(imageIndex, 1);

      return await this.roomRepository.save(room);
    } catch (error) {
      throw new BadRequestException('Error al eliminar la imagen');
    }
  }

  async updateImageOrder(
    roomId: string,
    imageUrls: string[],
    user: User,
  ): Promise<Room> {
    const room = await this.findRoomWithValidation(roomId, user);

    if (!room.imageUrls || room.imageUrls.length === 0) {
      throw new NotFoundException('La sala no tiene imágenes');
    }

    // Validar que todas las URLs proporcionadas existen en la sala
    const validUrls = imageUrls.every(url => room.imageUrls.includes(url));
    if (!validUrls || imageUrls.length !== room.imageUrls.length) {
      throw new BadRequestException('URLs de imagen inválidas');
    }

    // Reordenar los public IDs en el mismo orden
    const reorderedPublicIds = imageUrls.map(url => {
      const index = room.imageUrls.indexOf(url);
      return room.imagePublicIds[index];
    });

    room.imageUrls = imageUrls;
    room.imagePublicIds = reorderedPublicIds;

    return await this.roomRepository.save(room);
  }

  private async findRoomWithValidation(roomId: string, user: User): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['studio', 'studio.owner'],
    });

    if (!room) throw new NotFoundException('Sala no encontrada');
    if (room.studio.owner.id !== user.id) {
      throw new ForbiddenException(
        'No puedes gestionar imágenes de una sala que no es tuya',
      );
    }

    return room;
  }

  // Método auxiliar para eliminar múltiples imágenes de Cloudinary
  private async deleteImagesFromCloudinary(publicIds: string[]): Promise<void> {
    try {
      await this.fileuploadService.deleteFiles(publicIds);
    } catch (error) {
      console.error('Error eliminando imágenes de Cloudinary:', error);
    }
  }
}