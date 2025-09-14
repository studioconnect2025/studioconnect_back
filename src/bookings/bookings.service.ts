import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Repository } from 'typeorm';
import { Booking } from './dto/bookings.entity';
import { CreateBookingDto } from './dto/create-booking';
import { User } from 'src/users/entities/user.entity';
import { BookingStatus } from './enum/enums-bookings';
import { Room } from 'src/rooms/entities/room.entity';
import { PricingService } from 'src/pricingTotal/pricing.service';
import { BookingAction } from './enum/booking-action.enum';
import { ReprogramBookingDto } from './dto/reprogram-booking.dto';

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

  async cancelBooking(bookingId: string, musician: User): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, musician: { id: musician.id } },
      relations: ['room', 'room.studio', 'room.studio.owner'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    // Si ya fue cancelada por el músico
    if (booking.action === BookingAction.CANCELED) {
      throw new BadRequestException(
        'La reserva ya fue cancelada anteriormente.',
      );
    }

    // Validar límite de tiempo: mínimo 2 días antes de la reserva
    const now = new Date();
    const limitDate = new Date(booking.startTime);
    limitDate.setDate(limitDate.getDate() - 2);

    if (now > limitDate) {
      throw new BadRequestException(
        'Solo puedes cancelar la reserva hasta 2 días antes de la fecha de inicio.',
      );
    }

    // Validar máximo 2 cancelaciones por día para este músico
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const cancellationsToday = await this.bookingRepository.count({
      where: {
        musician: { id: musician.id },
        action: BookingAction.CANCELED, // contamos sólo acciones canceladas
        canceledAtDate: Between(today, tomorrow),
      },
    });

    if (cancellationsToday >= 2) {
      throw new BadRequestException(
        'Ya realizaste el máximo de 2 cancelaciones para hoy.',
      );
    }

    // MARCA la acción de cancelación (no tocamos BookingStatus que usa el dueño)
    booking.status = BookingStatus.CANCELED;
    booking.action = BookingAction.CANCELED; // NEW
    booking.canceledAtDate = new Date(); // NEW: guardamos la fecha de cancelación

    await this.bookingRepository.save(booking);

    // ALERTA para el dueño (console.log como acordamos)
    console.log(
      `🔔 ALERTA: Owner ${booking.room.studio.owner?.email} - La reserva ${booking.id} fue CANCELADA por el músico.`,
    );

    return booking;
  }

  // reprogramar (músico) — una vez y mínimo 2 días antes

  async reprogramBooking(
    bookingId: string,
    musician: User,
    dto: ReprogramBookingDto,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, musician: { id: musician.id } },
      relations: ['room', 'room.studio', 'room.studio.owner'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    // Validar si ya reprogramó antes
    if (booking.hasRescheduled) {
      throw new BadRequestException(
        'Solo puedes reprogramar una vez esta reserva.',
      );
    }

    // Validar límite de tiempo: mínimo 2 días antes (respecto a la reserva original)
    const now = new Date();
    const limitDate = new Date(booking.startTime);
    limitDate.setDate(limitDate.getDate() - 2);

    if (now > limitDate) {
      throw new BadRequestException(
        'Solo puedes reprogramar la reserva hasta 2 días antes de la fecha de inicio.',
      );
    }

    // Validar nuevas fechas
    const newStart = new Date(dto.newStartTime);
    const newEnd = new Date(dto.newEndTime);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      throw new BadRequestException('Fechas inválidas para la reprogramación.');
    }
    if (newStart >= newEnd) {
      throw new BadRequestException(
        'La nueva fecha de fin debe ser posterior a la nueva fecha de inicio.',
      );
    }

    // Validar room existe (si cambias de sala)
    const newRoom = await this.roomRepository.findOne({
      where: { id: dto.roomId },
      relations: ['studio'],
    });
    if (!newRoom) {
      throw new NotFoundException(`Sala con ID #${dto.roomId} no encontrada.`);
    }
    if (!newRoom.isActive) {
      throw new BadRequestException('La sala seleccionada no está activa.');
    }

    // Aplicamos la reprogramación: actualizamos times y room, marcamos hasRescheduled y dejamos status PENDING
    booking.startTime = newStart;
    booking.endTime = newEnd;
    booking.room = newRoom;
    booking.hasRescheduled = true; // ya reprogramada una vez
    booking.reprogramDate = new Date(); // registro de cuando se reprogramó
    booking.action = BookingAction.REPROGRAMMED; // NEW: marca acción de reprogramación
    booking.status = BookingStatus.PENDING; // vuelve a pendiente para que el dueño confirme disponibilidad

    await this.bookingRepository.save(booking);

    // ALERTA para el dueño (console.log)
    console.log(
      `🔔 ALERTA: Owner ${booking.room.studio.owner?.email} - La reserva ${booking.id} fue REPROGRAMADA por el músico. Debe confirmar disponibilidad.`,
    );

    return booking;
  }
}
