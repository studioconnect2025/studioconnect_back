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
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Crear una sala obteniendo automáticamente el studioId del usuario autenticado
   * NUEVO MÉTODO para flujo más fluido
   */
  async createWithAutoStudio(dto: CreateRoomDto, user: User): Promise<Room> {
    // Buscar el studio del usuario
    const studio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!studio) {
      throw new NotFoundException(
        'No tienes un estudio asociado. Crea un estudio primero.',
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

  /**
   * Método original - mantiene compatibilidad hacia atrás
   */
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
      await this.deleteImagesFromCloudinary(room.imagePublicIds);
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

  /**
   * NUEVO MÉTODO: Obtener todas las salas del usuario autenticado
   */
  async findRoomsByUser(user: User): Promise<Room[]> {
    const studio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
      relations: ['rooms', 'rooms.instruments'],
    });

    if (!studio) {
      throw new NotFoundException('No tienes un estudio asociado');
    }

    return studio.rooms;
  }

  // ===================== MÉTODOS PARA MANEJO DE IMÁGENES =====================

  async uploadImages(
    roomId: string,
    files: Express.Multer.File[],
    user: User,
  ): Promise<Room> {
    const room = await this.findRoomWithValidation(roomId, user);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    // Validar límite de imágenes
    const currentImageCount = room.imageUrls?.length || 0;
    const maxImages = 1;

    if (currentImageCount + files.length > maxImages) {
      throw new BadRequestException(
        `No puedes subir más de ${maxImages} imágenes por sala`,
      );
    }

    try {
      // 📌 Usar tu FileUploadService en lugar de simular
      const uploadPromises = files.map((file) =>
        this.fileUploadService.uploadFile(file, `rooms/${roomId}`),
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Guardar las URLs reales y public_ids que Cloudinary devuelve
      const newImageUrls = uploadResults.map((result) => result.secure_url);
      const newPublicIds = uploadResults.map((result) => result.public_id);

      room.imageUrls = [...(room.imageUrls || []), ...newImageUrls];
      room.imagePublicIds = [...(room.imagePublicIds || []), ...newPublicIds];

      return await this.roomRepository.save(room);
    } catch (error) {
      console.error('❌ Error al subir imágenes a Cloudinary:', error);
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
    const validUrls = imageUrls.every((url) => room.imageUrls.includes(url));
    if (!validUrls || imageUrls.length !== room.imageUrls.length) {
      throw new BadRequestException('URLs de imagen inválidas');
    }

    // Reordenar los public IDs en el mismo orden
    const reorderedPublicIds = imageUrls.map((url) => {
      const index = room.imageUrls.indexOf(url);
      return room.imagePublicIds[index];
    });

    room.imageUrls = imageUrls;
    room.imagePublicIds = reorderedPublicIds;

    return await this.roomRepository.save(room);
  }

  // ===================== MÉTODOS PRIVADOS/AUXILIARES =====================

  private async findRoomWithValidation(
    roomId: string,
    user: User,
  ): Promise<Room> {
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

  /**
   * Método auxiliar para eliminar múltiples imágenes de Cloudinary
   */
  private async deleteImagesFromCloudinary(publicIds: string[]): Promise<void> {
    try {
      await this.fileUploadService.deleteFiles(publicIds);
    } catch (error) {
      console.error('Error eliminando imágenes de Cloudinary:', error);
    }
  }

  /**
   * MÉTODO ADICIONAL: Si el usuario puede tener múltiples studios
   * Crear en el primer studio activo del usuario
   */
  async createWithAutoStudioMultiple(
    dto: CreateRoomDto,
    user: User,
  ): Promise<Room> {
    const studios = await this.studioRepository.find({
      where: { owner: { id: user.id } }, // Si tienes campo isActive: , isActive: true
      relations: ['owner'],
    });

    if (!studios || studios.length === 0) {
      throw new NotFoundException(
        'No tienes estudios asociados. Crea un estudio primero.',
      );
    }

    // Usar el primer studio o implementar lógica para seleccionar el principal
    const studio = studios[0];

    const room = this.roomRepository.create({
      ...dto,
      studio,
      imageUrls: [],
      imagePublicIds: [],
    });

    return this.roomRepository.save(room);
  }
}
