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
import { Studio } from 'src/studios/entities/studio.entity';

@Injectable()
export class InstrumentosService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Instruments)
    private readonly instrumentsRepository: Repository<Instruments>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
  ) {}
  async createForStudio(
    ownerId: string,
    createInstrumentoDto: CreateInstrumentDto,
  ): Promise<{ message: string; instrument: Instruments }> {
    const { categoryName, studioId, ...instrumentData } = createInstrumentoDto;

    // 1. Buscar estudio
    const studio = await this.studioRepository.findOne({
      where: { id: studioId, owner: { id: ownerId } },
    });
    if (!studio) {
      throw new NotFoundException(
        `El estudio con id ${studioId} no existe o no pertenece al dueño autenticado `,
      );
    }
    const newInstrumentExisting = await this.instrumentsRepository.findOne({
      where: { name: instrumentData.name, studio: { id: studioId } },
    });

    if (newInstrumentExisting) {
      throw new BadRequestException('Ya existe un instrumento con ese nombre');
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
      studio,
    });

    const newInstrumentDb =
      await this.instrumentsRepository.save(newInstrument);

    return {
      message: `Producto ${newInstrument.name} agregado con exito`,
      instrument: newInstrumentDb,
    };
  }

  async findAllForStudio(ownerId: string): Promise<Instruments[]> {
    return this.instrumentsRepository.find({
      where: {
        studio: {
          owner: {
            id: ownerId,
          },
        },
      },
      relations: ['category', 'studio'],
    });
  }

  async findInstrumentById(name: string): Promise<Instruments> {
    const instrumentName = await this.instrumentsRepository.findOne({
      where: { name },
    });

    if (!instrumentName) {
      throw new NotFoundException(`Instrumento de ${name} no encontrado`);
    }

    return instrumentName;
  }
}
