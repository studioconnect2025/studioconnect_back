import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Repository } from 'typeorm';
import { Instruments } from './entities/instrumento.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Injectable()
export class InstrumentosService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Instruments)
    private readonly instrumentsRepository: Repository<Instruments>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}
  async createForRoom(
    ownerId: string,
    createInstrumentoDto: CreateInstrumentDto,
  ): Promise<{ message: string; instrument: Instruments }> {
    const { categoryName, roomId, ...instrumentData } = createInstrumentoDto;

    // 1. Buscar eRoom
    const room = await this.roomRepository.findOne({
      where: {
        id: roomId,
        studio: {
          owner: { id: ownerId },
        },
      },
      relations: ['studio', 'studio.owner'], // necesario para que funcione la condición
    });

    if (!room) {
      throw new NotFoundException(
        `La sala con id ${roomId} no existe o no pertenece al dueño autenticado `,
      );
    }
    const newInstrumentExisting = await this.instrumentsRepository.findOne({
      where: { name: instrumentData.name, room: { id: roomId } },
    });

    if (newInstrumentExisting) {
      throw new BadRequestException(
        `El instrumento "${instrumentData.name}" ya existe en la sala "${room.name}"`,
      );
    }

    let category = await this.categoryRepository.findOneBy({
      name: categoryName,
    });

    if (!category) {
      category = this.categoryRepository.create({
        name: categoryName,
      });
      category = await this.categoryRepository.save(category);
    }

    const newInstrument = this.instrumentsRepository.create({
      ...instrumentData,
      category,
      room: { id: roomId },
    });

    const newInstrumentDb =
      await this.instrumentsRepository.save(newInstrument);

    return {
      message: `Instrumento ${newInstrument.name} agregado con exito`,
      instrument: newInstrumentDb,
    };
  }

  async findNamesByRoom(roomId: string): Promise<string[]> {
    const instruments = await this.instrumentsRepository.find({
      where: { room: { id: roomId } },
      select: ['name'],
    });
    return instruments.map((i) => i.name);
  }

  async findAllForRoom(ownerId: string): Promise<Instruments[]> {
    return this.instrumentsRepository.find({
      where: {
        room: {
          studio: {
            owner: {
              id: ownerId,
            },
          },
        },
      },
      relations: ['category', 'room'],
    });
  }

  async findInstrumentById(name: string, roomId: string): Promise<Instruments> {
    const instrumentName = await this.instrumentsRepository.findOne({
      where: { name, room: { id: roomId } },
      relations: ['room', 'category'],
    });

    if (!instrumentName) {
      throw new NotFoundException(
        `Instrumento "${name}" no encontrado en la sala con id ${roomId}`,
      );
    }

    return instrumentName;
  }
}
