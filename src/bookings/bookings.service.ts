import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { Booking } from './dto/bookings.entity';
import { CreateBookingDto } from './dto/create-booking';
import { User } from 'src/users/entities/user.entity';
import { BookingStatus } from './enum/enums-bookings';
import { Room } from 'src/rooms/entities/room.entity';
import { PricingService } from 'src/pricingTotal/pricing.service';
import { BookingAction } from './enum/booking-action.enum';
import { ReprogramBookingDto } from './dto/reprogram-booking.dto';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { EmailService } from 'src/auth/services/email.service';
import { Cron } from '@nestjs/schedule'; // Importa el decorador Cron

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Instruments)
    private readonly instrumentRepository: Repository<Instruments>,

    private readonly pricingService: PricingService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crea una nueva reserva para un músico.
   */
  async create(
    createBookingDto: CreateBookingDto,
    musician: User,
  ): Promise<Booking> {
    const { roomId, startTime, endTime, instrumentIds } = createBookingDto;

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
      relations: ['studio', 'studio.owner'], // Importante: Cargar 'owner' para obtener su email
    });

    if (!room)
      throw new NotFoundException(`Sala con ID #${roomId} no encontrado.`);
    if (!room.isActive)
      throw new ForbiddenException('El estudio no esta activo');

    // Lógica de validación de disponibilidad
    const conflictingBooking = await this.bookingRepository.findOne({
      where: {
        room: { id: roomId },
        status: BookingStatus.CONFIRMED,
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
      instrumentIds,
    );

    let instruments: Instruments[] = [];
    if (instrumentIds && instrumentIds.length > 0) {
      instruments = await this.instrumentRepository.find({
        where: {
          id: In(instrumentIds),
          room: { id: roomId },
        },
      });

      if (instruments.length !== instrumentIds.length) {
        throw new BadRequestException(
          'Algunos instrumentos seleccionados no pertenecen a la sala',
        );
      }
    }

    const newBooking = this.bookingRepository.create({
      room,
      studio: room.studio,
      musician,
      startTime,
      endTime,
      totalPrice,
      status: BookingStatus.PENDING,
      instruments,
    });

    const savedBooking = await this.bookingRepository.save(newBooking);

    // --- INICIO DE LA LÓGICA DE NOTIFICACIÓN POR EMAIL ---

    const bookingDetails = {
      roomName: room.name,
      studioName: room.studio.name,
      startTime: savedBooking.startTime,
      endTime: savedBooking.endTime,
      totalPrice: savedBooking.totalPrice,
      musicianEmail: musician.email,
    };

    // 1. Enviar email de confirmación de solicitud al músico
    await this.emailService.sendBookingRequestMusician(
      musician.email,
      bookingDetails,
    );

    // 2. Enviar email de notificación de nueva reserva al dueño del estudio
    if (room.studio.owner && room.studio.owner.email) {
      await this.emailService.sendBookingRequestOwner(
        room.studio.owner.email,
        bookingDetails,
      );
    } else {
      console.error(
        `ALERTA: No se pudo encontrar el email del dueño para el estudio con ID: ${room.studio.id}. No se envió la notificación.`,
      );
    }

    // --- FIN DE LA LÓGICA DE NOTIFICACIÓN ---

    return savedBooking;
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
      instruments: b.instruments.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
      })),
    }));
  }

  /**
   * Confirma una reserva específica, verificando la propiedad.
   */
  async confirmBooking(bookingId: string, user: User) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['room', 'room.studio', 'musician'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.room.studio.owner.id !== user.id)
      throw new ForbiddenException('No autorizado');

    booking.status = BookingStatus.CONFIRMED;
    await this.bookingRepository.save(booking);

    await this.emailService.sendBookingConfirmedEmail(booking.musician.email, {
      musicianName: booking.musician.email, // o el campo que uses
      studioName: booking.room.studio.name,
      studioAddress: booking.room.studio.address, // asumiendo que tienes esta propiedad
      roomName: booking.room.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      contactInfo: booking.room.studio.owner.email, // o email
    });

    await this.emailService.sendOwnerBookingConfirmedNotice(user.email, {
      musicianName: booking.musician.email, // o email
      roomName: booking.room.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      studioName: booking.room.studio.name,
    });
    // --- Fin Notificación ---
    return booking;
  }

  async rejectBooking(bookingId: string, user: User): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['room', 'room.studio', 'musician'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.room.studio.owner.id !== user.id)
      throw new ForbiddenException('No autorizado');

    booking.status = BookingStatus.REJECTED;
    await this.bookingRepository.save(booking);
    // --- Notificación ---
    await this.emailService.sendBookingRejectedEmail(booking.musician.email, {
      studioName: booking.room.studio.name,
      roomName: booking.room.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
    });
    // --- Fin Notificación ---
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

    await this.emailService.sendBookingCancellationEmail(musician.email, {
      studioName: booking.room.studio.name,
      roomName: booking.room.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
    });

    if (booking.room.studio.owner?.email) {
      await this.emailService.sendOwnerBookingUpdateAlert(
        booking.room.studio.owner.email,
        {
          musicianName: musician.email, // o email
          roomName: booking.room.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          studioName: booking.room.studio.name,
          totalPrice: booking.totalPrice,
        },
        `Se ha cancelado una reserva en ${booking.room.studio.name}`,
        `El músico ha cancelado su reserva. El siguiente horario ha quedado libre:`,
      );
    }
    // --- Fin Notificación ---
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
    // const newRoom = await this.roomRepository.findOne({
    //   where: { id: dto.roomId },
    //   relations: ['studio'],
    // });
    // if (!newRoom) {
    //   throw new NotFoundException(`Sala con ID #${dto.roomId} no encontrada.`);
    // }

    const room = booking.room;
    if (!room.isActive) {
      throw new BadRequestException('La sala seleccionada no está activa.');
    }

    // Aplicamos la reprogramación: actualizamos times y room, marcamos hasRescheduled y dejamos status PENDING
    booking.startTime = newStart;
    booking.endTime = newEnd;
    // booking.room = newRoom;
    booking.hasRescheduled = true; // ya reprogramada una vez
    booking.reprogramDate = new Date(); // registro de cuando se reprogramó
    booking.action = BookingAction.REPROGRAMMED; // NEW: marca acción de reprogramación
    booking.status = BookingStatus.PENDING; // vuelve a pendiente para que el dueño confirme disponibilidad

    await this.bookingRepository.save(booking);

    if (booking.room.studio.owner?.email) {
      await this.emailService.sendBookingRequestOwner(
        booking.room.studio.owner.email,
        {
          musicianEmail: musician.email,
          roomName: booking.room.name,
          studioName: booking.room.studio.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalPrice: booking.totalPrice,
        },
      );
    }

    // ALERTA para el dueño (console.log)
    console.log(
      `🔔 ALERTA: Owner ${booking.room.studio.owner?.email} - La reserva ${booking.id} fue REPROGRAMADA por el músico. Debe confirmar disponibilidad.`,
    );

    return booking;
  }

  @Cron('0 * * * *') // Se ejecuta cada hora, en el minuto 0.
  async handleBookingReminders() {
    this.logger.log(
      'Ejecutando CRON job para buscar recordatorios de reservas...',
    );

    const now = new Date();

    // --- Lógica para recordatorio de 48 horas ---
    const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    // Creamos una ventana de una hora para buscar reservas
    const fortySevenHoursLater = new Date(now.getTime() + 47 * 60 * 60 * 1000);

    const bookingsFor48hReminder = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        reminder48hSent: false, // Solo las que no han recibido este recordatorio
        startTime: Between(fortySevenHoursLater, fortyEightHoursLater),
      },
      relations: ['musician', 'room', 'room.studio'],
    });

    for (const booking of bookingsFor48hReminder) {
      this.logger.log(
        `Enviando recordatorio de 48h para la reserva ID: ${booking.id}`,
      );
      // Asumo que tienes un método en EmailService para esto
      await this.emailService.sendBookingReminder(
        booking.musician.email,
        booking,
        '48 horas',
      );

      booking.reminder48hSent = true;
      await this.bookingRepository.save(booking);
    }

    // --- Lógica para recordatorio de 24 horas ---
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Creamos una ventana de una hora para buscar reservas
    const twentyThreeHoursLater = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const bookingsFor24hReminder = await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
        reminder24hSent: false, // Solo las que no han recibido este recordatorio
        startTime: Between(twentyThreeHoursLater, twentyFourHoursLater),
      },
      relations: ['musician', 'room', 'room.studio'],
    });

    for (const booking of bookingsFor24hReminder) {
      this.logger.log(
        `Enviando recordatorio de 24h para la reserva ID: ${booking.id}`,
      );
      // Reutilizamos el método de EmailService
      await this.emailService.sendBookingReminder(
        booking.musician.email,
        booking,
        '24 horas',
      );

      booking.reminder24hSent = true;
      await this.bookingRepository.save(booking);
    }
  }

  async findOneForChat(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      // Cargamos el músico y el dueño del estudio a través de las relaciones
      relations: ['musician', 'studio', 'studio.owner'],
    });

    if (!booking) {
      throw new NotFoundException(`Reserva con ID ${bookingId} no encontrada.`);
    }
    return booking;
  }
}
