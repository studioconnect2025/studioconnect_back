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
import { CreateMembershipPaymentDto } from './dto/Create-Membership-Paymentdto';
import { PricingService } from 'src/pricingTotal/pricing.service';
import { Payment } from './entities/payment.entity';
import { EmailService } from 'src/auth/services/email.service';
import { MembershipsService } from 'src/membership/membership.service';
import { MembershipPlan } from 'src/membership/enum/enum.membership';
import { Membership } from 'src/membership/entities/membership.entity';
import { PaymentStatus } from 'src/bookings/enum/paymentStatus';
import { BookingStatus } from 'src/bookings/enum/enums-bookings';

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
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly pricingService: PricingService,
    private readonly emailService: EmailService,
    private readonly membershipsService: MembershipsService, // NEW
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY no definido');

    this.stripe = new Stripe(stripeKey, {});
  }

  async getAllPayments({
    page,
    limit,
    status,
    type,
    studioId,
    userId,
  }: {
    page: number;
    limit: number;
    status?: string;
    type?: 'booking' | 'membership';
    studioId?: string;
    userId?: string;
  }) {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.studio', 'bookingStudio')
      .leftJoinAndSelect('booking.musician', 'musician')
      .leftJoinAndSelect('payment.membership', 'membership')
      .leftJoinAndSelect('membership.studio', 'membershipStudio');

    if (status) query.andWhere('payment.status = :status', { status });

    if (type) {
      if (type === 'booking') query.andWhere('payment.booking IS NOT NULL');
      if (type === 'membership')
        query.andWhere('payment.membership IS NOT NULL');
    }

    if (studioId) {
      query.andWhere(
        '(bookingStudio.id = :studioId OR membershipStudio.id = :studioId)',
        { studioId },
      );
    }

    if (userId) query.andWhere('musician.id = :userId', { userId });

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC')
      .getManyAndCount();

    return { items, total, page, limit };
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

    if (!booking.studio.isActive) {
      throw new ForbiddenException(
        'El estudio no está activo. No se pueden recibir reservas.',
      );
    }

    const validInstrumentIds = dto.instrumentIds?.filter((id) => id) ?? [];

    const pricing = await this.pricingService.calculatePrice(
      booking.room.id,
      booking.startTime,
      booking.endTime,
      validInstrumentIds,
    );

    booking.totalPrice = pricing.totalPrice;

    const commissionAmountInCents =
      this.pricingService.calculateCommissionInCents(pricing.totalPrice);

    if (!booking.studio?.stripeAccountId) {
      throw new BadRequestException(
        'El estudio no tiene stripeAccountId configurado. No se puede realizar la transferencia.',
      );
    }

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(pricing.totalPrice * 100), // centavos
        currency: 'usd',
        capture_method: 'automatic',
        application_fee_amount: commissionAmountInCents,
        transfer_data: {
          destination: booking.studio.stripeAccountId,
        },
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
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Error creando PaymentIntent en Stripe: ${error.message}`,
        );
      }
      throw new BadRequestException('Error creando PaymentIntent en Stripe');
    }

    booking.paymentIntentId = paymentIntent.id;
    booking.paymentStatus = PaymentStatus.PENDING;
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
  ): Promise<{
    clientSecret: string;
    amount: number;
    paymentIntentId: string;
  }> {
    if (user.role !== UserRole.STUDIO_OWNER) {
      throw new ForbiddenException(
        'Solo dueños de estudio pueden pagar membresía',
      );
    }

    if (!user.studio) {
      throw new BadRequestException('El usuario no tiene un estudio asignado');
    }

    // Validar que el estudio esté activo
    if (!user.studio.isActive) {
      throw new ForbiddenException(
        'El estudio no está activo. No se pueden comprar membresías.',
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

    // NEW: Antes de retornar, guarda la membresía en estado INACTIVE con el paymentId de Stripe
    await this.membershipsService.create(
      {
        plan: dto.plan,
        paymentId: paymentIntent.id, // Guarda el ID de Stripe aquí
      },
      user,
    );

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      amount,
      paymentIntentId: paymentIntent.id,
    };
  }

  // 🔹 Confirmar pago (reserva o membresía)
  async confirmPayment(
    paymentIntentId: string,
  ): Promise<Booking | Membership | Stripe.PaymentIntent> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    const booking = await this.bookingRepo.findOne({
      where: { paymentIntentId },
      relations: ['room', 'studio', 'musician'],
    });

    if (booking) {
      if (paymentIntent.status === 'succeeded') {
        booking.isPaid = true;
        booking.paymentStatus = PaymentStatus.SUCCEEDED;
        booking.status = BookingStatus.CONFIRMED;
      } else {
        booking.paymentStatus = PaymentStatus.FAILED;
      }
      await this.bookingRepo.save(booking);

      const paymentRecord = this.paymentRepo.create({
        booking: booking,
        stripePaymentIntentId: paymentIntent.id,
        amount: (paymentIntent.amount_received ?? paymentIntent.amount) / 100,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
        currency: paymentIntent.currency ?? 'usd',
      });
      await this.paymentRepo.save(paymentRecord);
      return booking;
    }

    // Caso membresía (NEW)
    if (paymentIntent.metadata?.membershipPlan) {
      if (paymentIntent.status === 'succeeded') {
        try {
          const activatedMembership =
            await this.membershipsService.activateMembership(paymentIntent.id);

          const payment = this.paymentRepo.create({
            membership: activatedMembership,
            stripePaymentIntentId: paymentIntent.id,
            amount:
              (paymentIntent.amount_received ?? paymentIntent.amount) / 100,
            status: 'succeeded',
            currency: paymentIntent.currency ?? 'usd',
          });
          await this.paymentRepo.save(payment);
          return activatedMembership;
        } catch (error) {
          console.error('Error al activar la membresía:', error);
          return paymentIntent;
        }
      } else {
        // Si falló, podemos devolver solo el PaymentIntent
        return paymentIntent;
      }
    }

    return paymentIntent;
  }

  async capturePayment(paymentIntentId: string) {
    try {
      const intent = await this.stripe.paymentIntents.capture(paymentIntentId);

      const booking = await this.bookingRepo.findOne({
        where: { paymentIntentId },
        relations: ['room', 'studio', 'musician'],
      });

      if (booking) {
        booking.isPaid = true;
        booking.paymentStatus = PaymentStatus.SUCCEEDED;
        await this.bookingRepo.save(booking);
        await this.savePaymentRecordFromIntent(intent, 'succeeded');
      }

      return intent;
    } catch (err) {
      throw new BadRequestException(
        `Error capturando pago: ${(err as Error).message}`,
      );
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET no definido');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(
        `Stripe webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        await this.confirmPayment(intent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await this.confirmPayment(intent.id);

        // --- ✅ NOTIFICACIÓN DE FALLO DE PAGO AL ADMINISTRADOR ---
        const bookingId = intent.metadata?.bookingId;
        if (bookingId) {
          const booking = await this.bookingRepo.findOne({
            where: { id: bookingId },
            relations: ['musician'],
          });
          if (booking && booking.musician) {
            await this.emailService.sendPaymentFailureAdminNotification(
              booking.id,
              booking.musician.email,
              intent.amount / 100,
              intent.last_payment_error?.message ??
                'Error desconocido desde Stripe',
            );
          }
        }
        break;
      }

      default:
        break;
    }

    return { received: true };
  }

  private async savePaymentRecordFromIntent(
    intent: Stripe.PaymentIntent,
    status: string,
  ) {
    try {
      const bookingId = intent.metadata?.bookingId;
      let bookingEntity: Booking | null = null;
      if (bookingId) {
        bookingEntity = await this.bookingRepo.findOne({
          where: { id: bookingId },
        });
      }

      const amount = (intent.amount_received ?? intent.amount) / 100;

      const payment = this.paymentRepo.create({
        booking: bookingEntity,
        stripePaymentIntentId: intent.id,
        amount: amount,
        status: status,
        currency: intent.currency ?? process.env.STRIPE_CURRENCY ?? 'usd',
      });

      await this.paymentRepo.save(payment);
    } catch (err) {
      console.error('Error guardando payment record', err);
    }
  }

  async simulateBookingPayment(bookingId: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Simulación de pagos solo disponible en entornos de desarrollo',
      );
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['room', 'studio', 'musician'],
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.isPaid) throw new BadRequestException('Reserva ya pagada');

    booking.isPaid = true;
    booking.paymentStatus = PaymentStatus.SUCCEEDED;
    booking.paymentIntentId = `dev-simulated-${Date.now()}`;
    await this.bookingRepo.save(booking);

    const payment = this.paymentRepo.create({
      booking: booking,
      stripePaymentIntentId: booking.paymentIntentId,
      amount: booking.totalPrice ?? 0,
      status: 'succeeded',
      currency: process.env.STRIPE_CURRENCY ?? 'usd',
    });
    await this.paymentRepo.save(payment);

    return { booking, paymentId: payment.id };
  }

  private async handleSuccessfulPayment(
    booking: Booking,
    intent: Stripe.PaymentIntent,
  ) {
    booking.isPaid = true;
    booking.paymentStatus = PaymentStatus.SUCCEEDED;
    await this.bookingRepo.save(booking);

    await this.savePaymentRecordFromIntent(intent, 'succeeded');

    const totalAmount = intent.amount / 100;
    const commission = (intent.application_fee_amount || 0) / 100;
    const ownerPayout = totalAmount - commission;

    const bookingDetails = {
      studioName: booking.studio.name,
      roomName: booking.room.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: totalAmount,
      musicianEmail: booking.musician.email,
    };

    if (booking.musician?.email) {
      await this.emailService.sendPaymentSuccessMusician(
        booking.musician.email,
        bookingDetails,
        intent.id,
      );
    }

    if (booking.studio.owner?.email) {
      await this.emailService.sendPaymentReceivedOwner(
        booking.studio.owner.email,
        bookingDetails,
        ownerPayout,
      );
    }
  }
}
