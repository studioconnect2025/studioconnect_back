import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Booking } from './dto/bookings.entity';
import { CreateBookingDto } from './dto/create-booking';
import { User } from 'src/users/entities/user.entity';
import { BookingStatus } from './enum/enums-bookings';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    musician: User,
  ): Promise<Booking> {
    const { studioId, startTime, endTime } = createBookingDto;

    if (new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    const studio = await this.studioRepository.findOneBy({ id: studioId });
    if (!studio) {
      throw new NotFoundException(`Estudio con ID #${studioId} no encontrado.`);
    }

    // Lógica de validación de disponibilidad
    const conflictingBooking = await this.bookingRepository.findOne({
      where: {
        studio: { id: studioId },
        status: BookingStatus.CONFIRMED, // Solo chocar con reservas confirmadas
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
    });

    if (conflictingBooking) {
      throw new ConflictException(
        'El horario seleccionado ya no está disponible.',
      );
    }

    const newBooking = this.bookingRepository.create({
      studio,
      musician,
      startTime,
      endTime,
      // El estado PENDING se asignará por defecto (ver entidad)
    });

    return this.bookingRepository.save(newBooking);
  }

  // Devuelve todas las reservas de los estudios de un dueño
  async findOwnerBookings(ownerId: string): Promise<Booking[]> {
    const studios = await this.studioRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['bookings', 'bookings.musician'],
    });

    return studios.flatMap((studio) => studio.bookings);
  }
}
