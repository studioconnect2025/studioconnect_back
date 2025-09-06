import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
  ) {}

  async create(dto: CreateRoomDto, user: User, studioId: string): Promise<Room> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['owner'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException('No puedes crear salas en un estudio que no es tuyo');
    }

    const room = this.roomRepository.create({
      ...dto,
      studio,
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
}
