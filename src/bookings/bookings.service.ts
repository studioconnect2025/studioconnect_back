import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Booking, BookingStatus } from './dto/bookings.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Studio)
    private readonly studioRepo: Repository<Studio>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Devuelve todas las reservas de los estudios de un dueño
  async findOwnerBookings(ownerId: string): Promise<Booking[]> {
    const studios = await this.studioRepo.find({
      where: { owner: { id: ownerId } },
      relations: ['bookings', 'bookings.musician'],
    });

    return studios.flatMap((studio) => studio.bookings);
  }

  async createBooking(
    studioId: string,
    musicianId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const studio = await this.studioRepo.findOne({ where: { id: studioId } });
    if (!studio) throw new Error('Studio no encontrado');

    const musician = await this.userRepo.findOne({ where: { id: musicianId } });
    if (!musician) throw new Error('Músico no encontrado');

    const booking = this.bookingRepo.create({
      studio,
      musician,
      startDate,
      endDate,
      status: BookingStatus.PENDIENTE,
    });

    return this.bookingRepo.save(booking);
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new Error('Reserva no encontrada');

    booking.status = BookingStatus.CONFIRMADA;
    return this.bookingRepo.save(booking);
  }

  async rejectBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new Error('Reserva no encontrada');

    booking.status = BookingStatus.RECHAZADA;
    return this.bookingRepo.save(booking);
  }
}
