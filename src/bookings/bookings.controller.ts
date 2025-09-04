import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { CreateBookingDto } from './dto/create-booking';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // --- RUTA PARA MÚSICOS ---

  /**
   * Crea una nueva reserva. Solo para usuarios con rol de Músico.
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    // req.user contiene el payload del JWT del músico autenticado
    return this.bookingsService.create(createBookingDto, req.user);
  }

  // --- RUTAS PARA DUEÑOS DE ESTUDIO ---

  /**
   * Obtiene todas las reservas de los estudios que pertenecen al dueño autenticado.
   */
  @Get('owner/my-bookings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  getMyStudioBookings(@Request() req) {
    // Se usa el ID del dueño del estudio desde el token para más seguridad
    return this.bookingsService.findOwnerBookings(req.user.id);
  }

  /**
   * Confirma una reserva específica. Solo para el dueño del estudio.
   */
  @Patch('owner/:bookingId/confirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @Request() req,
  ) {
    // El servicio deberá verificar que el dueño (req.user) es propietario de esta reserva
    return this.bookingsService.confirmBooking(bookingId, req.user);
  }

  /**
   * Rechaza una reserva específica. Solo para el dueño del estudio.
   */
  @Patch('owner/:bookingId/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async rejectBooking(
    @Param('bookingId') bookingId: string,
    @Request() req,
  ) {
    // El servicio deberá verificar que el dueño (req.user) es propietario de esta reserva
    return this.bookingsService.rejectBooking(bookingId, req.user);
  }
}

