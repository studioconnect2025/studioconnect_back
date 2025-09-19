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
import { Payment } from './entities/payment.entity';

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
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY no definido');

    this.stripe = new Stripe(stripeKey, {});
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

    const validInstrumentIds = dto.instrumentIds?.filter((id) => id) ?? [];

    // 🔹 Calcular precio de sala
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

    // 🔹 Crear PaymentIntent en Stripe (con reparto de comisión)
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(pricing.totalPrice * 100), // centavos
        currency: 'usd',
        capture_method: 'manual',
        application_fee_amount: commissionAmountInCents, // 👈 comisión que se queda tu plataforma
        transfer_data: {
          destination: booking.studio.stripeAccountId, // 👈 la cuenta del dueño del estudio
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

  async capturePayment(paymentIntentId: string) {
    try {
      const intent = await this.stripe.paymentIntents.capture(paymentIntentId);

      // ✅ Ahora sí, se marca como pagado después de la confirmación del dueño
      const booking = await this.bookingRepo.findOne({
        where: { paymentIntentId },
        relations: ['room', 'studio', 'musician'],
      });

      if (booking) {
        booking.isPaid = true;
        booking.paymentStatus = 'SUCCEEDED';
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
      // relanza para que el controller devuelva 400
      throw new BadRequestException(
        `Stripe webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    // Maneja los eventos que te interesan
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        // Actualiza booking o estudio según metadata
        await this.confirmPayment(intent.id);

        // Guarda registro en payments (historial)
        await this.savePaymentRecordFromIntent(intent, 'succeeded');
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await this.confirmPayment(intent.id); // tu lógica ya marca como FAILED
        await this.savePaymentRecordFromIntent(intent, 'failed');
        break;
      }

      // Puedes añadir otros eventos que quieras procesar (ex: charge.refunded)
      default:
        // no hacemos nada por defecto, pero podrías loguear
        break;
    }

    return { received: true };
  }

  /**
   * Crea un registro en la tabla payments a partir del PaymentIntent
   */
  private async savePaymentRecordFromIntent(
    intent: Stripe.PaymentIntent,
    status: string,
  ) {
    try {
      // Si el Payment entity está pensado para vincular Booking, intenta encontrar la bookingId en metadata
      const bookingId = intent.metadata?.bookingId;
      let bookingEntity: Booking | null = null;
      if (bookingId) {
        bookingEntity = await this.bookingRepo.findOne({
          where: { id: bookingId },
        });
      }

      const amount = (intent.amount_received ?? intent.amount) / 100; // en tu entity guardas decimal en unidades

      const payment = this.paymentRepo.create({
        booking: bookingEntity, // si tu columna no acepta null, ajusta
        stripePaymentIntentId: intent.id,
        amount: amount,
        status: status,
        currency: intent.currency ?? process.env.STRIPE_CURRENCY ?? 'usd',
      });

      await this.paymentRepo.save(payment);
    } catch (err) {
      console.error('Error guardando payment record', err);
      // No debe bloquear el webhook; solo loguear (o enviar a tu logger)
      // console.error('Error guardando payment record', err);
    }
  }

  /**
   * Endpoint utilitario para desarrollo: simula un pago de reserva
   * Respeta la lógica de marcar isPaid/paymentStatus y guarda Payment record.
   */
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

    // Marca como pagado
    booking.isPaid = true;
    booking.paymentStatus = 'SUCCEEDED';
    booking.paymentIntentId = `dev-simulated-${Date.now()}`;
    await this.bookingRepo.save(booking);

    // Guarda un registro en payments
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
}
