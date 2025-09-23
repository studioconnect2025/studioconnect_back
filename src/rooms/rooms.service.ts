// rooms.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import { EmailService } from 'src/auth/services/email.service';
import { StudioStatus } from 'src/studios/enum/studio-status.enum';
import { MembershipsService } from 'src/membership/membership.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly membershipsService: MembershipsService,
  ) {}

  // ... (create, createWithAutoStudio, and other methods remain unchanged)
  async createWithAutoStudio(dto: CreateRoomDto, user: User): Promise<Room> {
    const studio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
      relations: ['owner', 'rooms'], // Cargar las salas para el conteo
    });

    if (!studio) {
      throw new NotFoundException(
        'No tienes un estudio asociado. Crea un estudio primero.',
      );
    }

    if (studio.status !== StudioStatus.APPROVED) {
      throw new BadRequestException(
        'Tu estudio aún no está aprobado por el administrador, no puedes crear salas.',
      );
    }

    const totalRooms = studio.rooms.length;
    if (totalRooms >= 2) {
      const activeMembership =
        await this.membershipsService.getActiveMembership(studio.id);
      if (!activeMembership) {
        throw new ForbiddenException(
          'Error al crear sala: debes adquirir una membresía para poder crear otra sala',
        );
      }
    }

    const isPremium = studio.rooms.length >= 2;
    const room = this.roomRepository.create({
      ...dto,
      studio,
      imageUrls: [],
      imagePublicIds: [],
      isPremium,
      isActive: true,
    });

    const savedRoom = await this.roomRepository.save(room);

    this.emailService.sendNewRoomAddedEmail(
      user.email,
      studio.name,
      savedRoom.name,
      savedRoom.id,
    );

    return savedRoom;
  }

  async create(
    dto: CreateRoomDto,
    user: User,
    studioId: string,
  ): Promise<Room> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['owner', 'rooms'], // Cargar las salas para el conteo
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException(
        'No puedes crear salas en un estudio que no es tuyo',
      );
    }

    if (studio.status !== StudioStatus.APPROVED) {
      throw new BadRequestException(
        'Este estudio aún no está aprobado, no puedes crear salas.',
      );
    }

    const totalRooms = studio.rooms.length;
    if (totalRooms >= 2) {
      const activeMembership =
        await this.membershipsService.getActiveMembership(studio.id);
      if (!activeMembership) {
        throw new ForbiddenException(
          'Error al crear sala: debes adquirir una membresía para poder crear otra sala',
        );
      }
    }

    const isPremium = studio.rooms.length >= 2;

    const room = this.roomRepository.create({
      ...dto,
      studio,
      imageUrls: [],
      imagePublicIds: [],
      isPremium,
      isActive: true,
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
    const updatedRoom = await this.roomRepository.save(room);

    this.emailService.sendProfileUpdateEmail(
      user.email,
      'Sala',
      updatedRoom.name,
      'Detalles de la sala',
    );

    return updatedRoom;
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

    if (room.imagePublicIds && room.imagePublicIds.length > 0) {
      await this.deleteImagesFromCloudinary(room.imagePublicIds);
    }

    await this.roomRepository.remove(room);
  }

  async findRoomsByStudio(studioId: string): Promise<Room[]> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['rooms', 'rooms.instruments'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    return studio.rooms;
  }

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
  
  async uploadImages(
    roomId: string,
    files: Express.Multer.File[],
    user: User,
  ): Promise<Room> {
    const room = await this.findRoomWithValidation(roomId, user);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const currentImageCount = room.imageUrls?.length || 0;
    const maxImages = 5; // Límite de 5 imágenes

    if (currentImageCount + files.length > maxImages) {
      throw new BadRequestException(
        `No puedes subir más de ${maxImages} imágenes por sala`,
      );
    }

    try {
      const uploadPromises = files.map((file) =>
        this.fileUploadService.uploadFile(file, `rooms/${roomId}`),
      );

      const uploadResults = await Promise.all(uploadPromises);

      const newImageUrls = uploadResults.map((result) => result.secure_url);
      const newPublicIds = uploadResults.map((result) => result.public_id);

      room.imageUrls = [...(room.imageUrls || []), ...newImageUrls];
      room.imagePublicIds = [...(room.imagePublicIds || []), ...newPublicIds];

      return await this.roomRepository.save(room);
    } catch (error) {
      this.logger.error('Error al subir imágenes a Cloudinary:', error);
      throw new BadRequestException('Error al subir las imágenes');
    }
  }

  // --- 🔥 MÉTODO CORREGIDO ---
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
      // ✅ 1. Eliminar de Cloudinary especificando el tipo de recurso 'image'.
      // Esto asume que tu `fileUploadService.deleteFile` puede aceptar un segundo argumento.
      await this.fileUploadService.deleteFile(publicIdToDelete, 'image');

      // ✅ 2. Remover de los arrays en la base de datos solo si la eliminación anterior fue exitosa.
      room.imageUrls.splice(imageIndex, 1);
      room.imagePublicIds.splice(imageIndex, 1);

      return await this.roomRepository.save(room);
    } catch (error) {
      this.logger.error(`Error al eliminar imagen: ${error.message}`);
      throw new BadRequestException('No se pudo eliminar la imagen del servidor externo.');
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

    const validUrls = imageUrls.every((url) => room.imageUrls.includes(url));
    if (!validUrls || imageUrls.length !== room.imageUrls.length) {
      throw new BadRequestException('URLs de imagen inválidas');
    }

    const reorderedPublicIds = imageUrls.map((url) => {
      const index = room.imageUrls.indexOf(url);
      return room.imagePublicIds[index];
    });

    room.imageUrls = imageUrls;
    room.imagePublicIds = reorderedPublicIds;

    return await this.roomRepository.save(room);
  }

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

  private async deleteImagesFromCloudinary(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map((publicId) =>
        this.fileUploadService.deleteFile(publicId, 'image'),
      );
      await Promise.all(deletePromises);
      this.logger.log(`✅ ${publicIds.length} imágenes eliminadas de Cloudinary.`);
    } catch (error) {
      this.logger.error('Error eliminando imágenes de Cloudinary:', error);
    }
  }

  // ... (createWithAutoStudioMultiple and CRON job remain unchanged)
  async createWithAutoStudioMultiple(
    dto: CreateRoomDto,
    user: User,
  ): Promise<Room> {
    const studios = await this.studioRepository.find({
      where: { owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!studios || studios.length === 0) {
      throw new NotFoundException(
        'No tienes estudios asociados. Crea un estudio primero.',
      );
    }

    const approvedStudios = studios.filter(
      (studio) => studio.status === StudioStatus.APPROVED,
    );

    if (approvedStudios.length === 0) {
      throw new BadRequestException(
        'No tienes estudios aprobados por el administrador, no puedes crear salas.',
      );
    }

    const studio = approvedStudios[0];

    const room = this.roomRepository.create({
      ...dto,
      studio,
      imageUrls: [],
      imagePublicIds: [],
    });

    return this.roomRepository.save(room);
  }

  @Cron('0 0 * * *')
  async deactivateExpiredPremiumRooms() {
    this.logger.log('Ejecutando CRON para desactivar salas premium...');

    const studios = await this.studioRepository.find({ relations: ['rooms'] });

    for (const studio of studios) {
      const activeMembership =
        await this.membershipsService.getActiveMembership(studio.id);

      if (!activeMembership) {
        const roomsToDeactivate = studio.rooms.filter(
          (r) => r.isPremium && r.isActive,
        );
        for (const room of roomsToDeactivate) {
          room.isActive = false;
          await this.roomRepository.save(room);
          this.logger.log(
            `Sala ${room.name} desactivada por membresía expirada.`,
          );
        }
      } else {
        const roomsToActivate = studio.rooms.filter(
          (r) => r.isPremium && !r.isActive,
        );
        for (const room of roomsToActivate) {
          room.isActive = true;
          await this.roomRepository.save(room);
          this.logger.log(`Sala ${room.name} reactivada por membresía activa.`);
        }
      }
    }
  }
}
