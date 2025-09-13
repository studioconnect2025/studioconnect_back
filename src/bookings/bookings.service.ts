import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Booking } from './dto/bookings.entity';
import { CreateBookingDto } from './dto/create-booking';
import { User } from 'src/users/entities/user.entity';
import { BookingStatus } from './enum/enums-bookings';
import { Room } from 'src/rooms/entities/room.entity';
import { PricingService } from 'src/pricingTotal/pricing.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Crea una nueva reserva para un músico.
   */
  async create(
    createBookingDto: CreateBookingDto,
    musician: User,
  ): Promise<Booking> {
    const { roomId, startTime, endTime } = createBookingDto;

    const start = new Date(startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (start < tomorrow) {
      throw new BadRequestException(
        'Las reservas deben realizarse para fechas posteriores al día actual.',
      );
    }

    if (new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['studio'],
    });
    if (!room)
      throw new NotFoundException(`sala con ID #${roomId} no encontrado.`);
    if (!room.isActive)
      throw new ForbiddenException('El estudio no esta activo');

    // Lógica de validación de disponibilidad
    const conflictingBooking = await this.bookingRepository.findOne({
      where: {
        room: { id: roomId },
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

    const { totalPrice } = await this.pricingService.calculatePrice(
      roomId,
      startTime,
      endTime,
    );

    const newBooking = this.bookingRepository.create({
      room,
      studio: room.studio,
      musician,
      startTime,
      endTime,
      totalPrice,
      status: BookingStatus.PENDING,
    });
    console.log('TOTAL PRICE CALCULATED:', totalPrice);

    return this.bookingRepository.save(newBooking);
  }

  /**
   * Devuelve todas las reservas de los estudios que pertenecen a un dueño.
   */
  async findOwnerBookings(ownerId: string) {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('room.studio', 'studio')
      .leftJoinAndSelect('booking.musician', 'musician')
      .where('studio.ownerId = :ownerId', { ownerId })
      .getMany();

    // Retornamos solo los campos relevantes y el estado
    return bookings.map((b) => ({
      id: b.id,
      room: b.room.name,
      studio: b.room.studio.name,
      musician: b.musician.email,
      startTime: b.startTime,
      endTime: b.endTime,
      totalPrice: b.totalPrice,
      status: b.status, // PENDIENTE, CONFIRMADA, RECHAZADA, COMPLETADA
      isPaid: b.isPaid,
    }));
  }

  async findMusicianBookings(musicianId: string) {
    const bookings = await this.bookingRepository.find({
      where: { musician: { id: musicianId } },
      relations: ['room', 'room.studio'],
      order: { startTime: 'DESC' }, // opcional, ordenadas por fecha
    });

    return bookings.map((b) => ({
      id: b.id,
      room: b.room.name,
      studio: b.room.studio.name,
      startTime: b.startTime,
      endTime: b.endTime,
      totalPrice: b.totalPrice,
      status: b.status, // PENDIENTE, CONFIRMADA, RECHAZADA, COMPLETADA
      isPaid: b.isPaid,
    }));
  }

  /**
   * Confirma una reserva específica, verificando la propiedad.
   */
  async confirmBooking(bookingId: string, user: User) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['room', 'room.studio'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.room.studio.owner.id !== user.id)
      throw new ForbiddenException('No autorizado');

    booking.status = BookingStatus.CONFIRMED;
    await this.bookingRepository.save(booking);
    return booking;
  }

  async rejectBooking(bookingId: string, user: User): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['room', 'room.studio'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.room.studio.owner.id !== user.id)
      throw new ForbiddenException('No autorizado');

    booking.status = BookingStatus.REJECTED;
    await this.bookingRepository.save(booking);
    return booking;
  }

  /**
   * Método privado para verificar que una reserva pertenece a un estudio del dueño.
   */
  private async verifyBookingOwnership(
    bookingId: string,
    ownerId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['studio', 'studio.owner'], // Cargar el estudio y su dueño
    });

    if (!booking) {
      throw new NotFoundException(
        `Reserva con ID #${bookingId} no encontrada.`,
      );
    }

    if (booking.studio.owner.id !== ownerId) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar esta reserva.',
      );
    }

    return booking;
  }
}
