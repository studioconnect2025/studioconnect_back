import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { BookingStatus } from 'src/bookings/enum/enums-bookings';
import { EmailService } from 'src/auth/services/email.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly emailService: EmailService,
  ) {}

  // Crear reseña
  async createReview(
    bookingId: string,
    dto: CreateReviewDto,
    musician: User,
  ): Promise<Review> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['musician', 'room', 'room.studio'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.musician.id !== musician.id) {
      throw new ForbiddenException('No autorizado para reseñar esta reserva');
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Solo puedes reseñar reservas confirmadas/completadas',
      );
    }

    if (booking.endTime > new Date()) {
      throw new BadRequestException(
        'Solo puedes reseñar una vez terminada la reserva',
      );
    }

    // Validar reseña existente
    const existing = await this.reviewRepository.findOne({
      where: { booking: { id: bookingId }, musician: { id: musician.id } },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una reseña para esta reserva');
    }

    const review = this.reviewRepository.create({
      rating: dto.rating,
      comment: dto.comment,
      musician,
      room: booking.room,
      booking,
    });

      const savedReview = await this.reviewRepository.save(review);

    // --- INICIO DE LA NUEVA LÓGICA DE NOTIFICACIÓN ---
    const owner = booking.room.studio.owner;
    if (owner && owner.email) {
      const musicianName = musician.profile?.nombre || musician.email;
      
      this.emailService.sendNewReviewNotification(
        owner.email,
        musicianName,
        booking.room.studio.name,
        savedReview.rating,
        savedReview.comment,
        booking.room.studio.id,
      );
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    return savedReview;
  }

  // Obtener reseñas de una sala (propiedades TS)
  async getReviewsForRoom(roomId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { room: { id: roomId } },
      relations: ['musician', 'booking'],
      order: { createdAt: 'DESC' }, // propiedad TS
    });
  }

  // Obtener reseñas de todas las salas de un dueño (QueryBuilder / nombres DB)
 async getReviewsForOwner(ownerId: string): Promise<Review[]> {
  return this.reviewRepository
    .createQueryBuilder('review')
    .leftJoinAndSelect('review.room', 'room')
    .leftJoinAndSelect('room.studio', 'studio')
    .leftJoinAndSelect('review.musician', 'musician')
    .where('studio."ownerId" = :ownerId', { ownerId })
    .orderBy('review.created_at', 'DESC')
    .getMany();
}

}
