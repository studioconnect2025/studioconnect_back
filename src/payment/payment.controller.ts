import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateMembershipPaymentDto } from './dto/Create-Membership-Paymentdto';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Stripe } from 'stripe';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
type RawBodyRequest = ExpressRequest & { body: Buffer };

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 🔹 Pago de reserva
  @Post('booking')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  @ApiOperation({
    summary: 'Pagar reserva de sala + instrumentos (solo músicos)',
  })
  @ApiResponse({ status: 201, description: 'PaymentIntent creado' })
  async createBookingPayment(
    @Request() req: { user: User },
    @Body() dto: CreatePaymentDto,
  ): Promise<{
    clientSecret: string;
    bookingId: string;
    paymentIntentId: string;
    totalPrice: number;
  }> {
    return this.paymentsService.createBookingPayment(req.user, dto);
  }

  // 🔹 Pago de membresía
  @Post('membership')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Pagar membresía mensual/anual (solo dueños)' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent de membresía creado',
  })
  async createMembershipPayment(
    @Request() req: { user: User },
    @Body() dto: CreateMembershipPaymentDto,
  ): Promise<{ clientSecret: string; amount: number }> {
    return this.paymentsService.createMembershipPayment(req.user, dto);
  }

  // 🔹 Confirmación de pago
  @Get('confirm/:paymentIntentId')
  @ApiOperation({ summary: 'Confirmar estado de un PaymentIntent' })
  async confirmPayment(
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<
    Booking | { studioId: string; isActive: boolean } | Stripe.PaymentIntent
  > {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    // req.body es Buffer por bodyParser.raw
    const rawBody = req.body as Buffer;

    if (!signature) {
      throw new BadRequestException('Stripe signature header missing');
    }

    return this.paymentsService.handleStripeWebhook(rawBody, signature);
  }

  /**
   * Endpoint dev-only para simular pago de reserva.
   * Respeta tu lógica: solo músicos pueden pagar reservas, y solo en dev.
   */
  @Post('simulate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  @ApiOperation({ summary: '[DEV] Simular pago de reserva (solo dev env)' })
  async simulatePayment(
    @Request() req: { user: User },
    @Body() body: { bookingId: string },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Simulación no permitida en producción');
    }

    const result = await this.paymentsService.simulateBookingPayment(
      body.bookingId,
    );
    return { ok: true, ...result };
  }
}
