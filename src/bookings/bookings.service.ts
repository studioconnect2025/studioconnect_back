// src/bookings/bookings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Booking } from './dto/bookings.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Studio)
    private readonly studioRepo: Repository<Studio>,
  ) {}

  // Devuelve todas las reservas de los estudios de un dueño
  async findOwnerBookings(ownerId: string): Promise<Booking[]> {
    const studios = await this.studioRepo.find({
      where: { owner: { id: ownerId } },
      relations: ['bookings', 'bookings.musician'],
    });

    return studios.flatMap(studio => studio.bookings);
  }

  async createBooking(studioId: string, musicianId: string, startDate: Date, endDate: Date) {
    const studio = await this.studioRepo.findOne({ where: { id: studioId } });
    if (!studio) throw new Error('Studio no encontrado');

    const booking = this.bookingRepo.create({
      studio,
      musician: { id: musicianId } as any,
      startDate,
      endDate,
    });

    return this.bookingRepo.save(booking);
  }
}
