import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
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
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    Booking | { studioId: string; isActive: boolean } | Stripe.PaymentIntent
  > {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }
}
