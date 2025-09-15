import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { User } from 'src/users/entities/user.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { UserRole } from 'src/auth/enum/roles.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  CreateMembershipPaymentDto,
  MembershipPlan,
} from './dto/Create-Membership-Paymentdto';
import { PricingService } from 'src/pricingTotal/pricing.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(Instruments)
    private readonly instrumentRepo: Repository<Instruments>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Studio) private readonly studioRepo: Repository<Studio>,
    private readonly pricingService: PricingService,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY no definido');

    this.stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
  }

  // 🔹 Pago de reserva por músicos
  async createBookingPayment(
    user: User,
    dto: CreatePaymentDto,
  ): Promise<{
    clientSecret: string;
    bookingId: string;
    paymentIntentId: string;
    totalPrice: number;
  }> {
    if (user.role !== UserRole.MUSICIAN) {
      throw new ForbiddenException('Solo músicos pueden pagar reservas');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['room', 'studio', 'musician'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.isPaid) throw new ForbiddenException('Reserva ya pagada');
    if (!booking.room)
      throw new BadRequestException('La reserva debe tener una sala asignada');

    // 🔹 Verificar que el estudio esté activo
    if (!booking.studio.isActive) {
      throw new ForbiddenException(
        'El estudio no está activo. No se pueden recibir reservas.',
      );
    }

    // 🔹 Calcular precio de sala
    const pricing = await this.pricingService.calculatePrice(
      booking.room.id,
      booking.startTime,
      booking.endTime,
      dto.instrumentIds,
    );

    booking.totalPrice = pricing.totalPrice;

    // 🔹 Crear PaymentIntent en Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(pricing.totalPrice * 100), // centavos
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        studioId: booking.studio.id,
        roomId: booking.room.id,
        instruments: pricing.instrumentsList.map((i) => i.id).join(','),
        roomCommission: pricing.roomCommission.toFixed(2),
        roomOwnerAmount: pricing.roomOwnerAmount.toFixed(2),
        instrumentsAmount: pricing.instrumentsAmount.toFixed(2),
      },
    });

    booking.paymentIntentId = paymentIntent.id;
    booking.paymentStatus = 'PENDING';
    await this.bookingRepo.save(booking);

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      bookingId: booking.id,
      paymentIntentId: paymentIntent.id,
      totalPrice: pricing.totalPrice,
    };
  }

  // 🔹 Pago de membresía para dueños
  async createMembershipPayment(
    user: User,
    dto: CreateMembershipPaymentDto,
  ): Promise<{ clientSecret: string; amount: number }> {
    if (user.role !== UserRole.STUDIO_OWNER) {
      throw new ForbiddenException(
        'Solo dueños de estudio pueden pagar membresía',
      );
    }

    const amount = dto.plan === MembershipPlan.MONTHLY ? 25 : 100;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        userId: user.id,
        studioId: user.studio?.id ?? '',
        membershipPlan: dto.plan,
      },
    });

    return { clientSecret: paymentIntent.client_secret ?? '', amount };
  }

  // 🔹 Confirmar pago (reserva o membresía)
  async confirmPayment(
    paymentIntentId: string,
  ): Promise<
    Booking | { studioId: string; isActive: boolean } | Stripe.PaymentIntent
  > {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    // 🔹 Caso pago de reserva
    const booking = await this.bookingRepo.findOne({
      where: { paymentIntentId },
      relations: ['room', 'studio', 'musician'],
    });

    if (booking) {
      if (paymentIntent.status === 'succeeded') {
        booking.isPaid = true;
        booking.paymentStatus = 'SUCCEEDED';
      } else {
        booking.paymentStatus = 'FAILED';
      }
      await this.bookingRepo.save(booking);
      return booking;
    }

    // 🔹 Caso pago de membresía
    const studioId = paymentIntent.metadata?.studioId;
    if (studioId) {
      const studio = await this.studioRepo.findOne({ where: { id: studioId } });
      if (!studio) throw new NotFoundException('Studio no encontrado');

      studio.isActive = paymentIntent.status === 'succeeded';
      await this.studioRepo.save(studio);

      return { studioId: studio.id, isActive: studio.isActive };
    }

    return paymentIntent;
  }
}
