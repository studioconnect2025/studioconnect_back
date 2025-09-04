/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { DataSource, Repository } from 'typeorm';
import rawData from '../data.json';
import { InstrumentData } from 'src/interface/interface-datajson';
const data: InstrumentData[] = rawData;

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    private readonly datasource: DataSource,

    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    @InjectRepository(Instruments)
    private readonly instrumentsRepository: Repository<Instruments>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async onApplicationBootstrap() {
    const instrumentCount = await this.instrumentsRepository.count();
    if (instrumentCount === 0) {
      await this.seed();
      console.log('Datos precargados desde data.json');
    }
  }

  async seed() {
    const categoryNames: string[] = Array.from(
      new Set(data.map((item) => item.category)),
    );

    const categoriesToInsert = categoryNames.map((name) => ({ name }));
    await this.categoriesRepository.upsert(categoriesToInsert, ['name']);

    const categories = await this.categoriesRepository.find();

    const instrumentsToInsert: Instruments[] = data.map((item) => {
      const instrument = new Instruments();
      instrument.name = item.name;
      instrument.description = item.description;
      instrument.price = item.price;
      instrument.imgUrl = item.imgUrl;
      instrument.available = item.available;

      const matchedCategory = categories.find(
        (cat) => cat.name === item.category,
      );
      if (matchedCategory) {
        instrument.category = matchedCategory;
      }

      return instrument;
    });

    await this.instrumentsRepository.upsert(instrumentsToInsert, ['name']);

    return 'Datos precargados correctamente desde la data.json';
  }

  async resetData(): Promise<string> {
    const existingBooking = await this.bookingRepository.find();

    if (existingBooking.length > 0) {
      throw new BadRequestException(
        'No se puede resetear: existen Booking registradas.',
      );
    }

    await this.datasource.query(`
      TRUNCATE TABLE
        "BOOKING",
        "INSTRUMENTS",
        "CATEGORIES"
      CASCADE
    `);

    return 'Datos reseteados correctamente (sin Booking activas).';
  }
}
