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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Bookings') // 👉 Agrupa todo en la sección Bookings
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // --- RUTA PARA MÚSICOS ---

  @ApiOperation({ summary: 'Crear una nueva reserva (solo músicos)' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para la reserva' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingsService.create(createBookingDto, req.user);
  }

  // --- RUTAS PARA DUEÑOS DE ESTUDIO ---

  @ApiOperation({ summary: 'Obtener todas las reservas de mis estudios (solo dueño)' })
  @ApiResponse({ status: 200, description: 'Lista de reservas recuperada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('owner/my-bookings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  getMyStudioBookings(@Request() req) {
    return this.bookingsService.findOwnerBookings(req.user.id);
  }

  @ApiOperation({ summary: 'Confirmar una reserva (solo dueño)' })
  @ApiResponse({ status: 200, description: 'Reserva confirmada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @Patch('owner/:bookingId/confirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @Request() req,
  ) {
    return this.bookingsService.confirmBooking(bookingId, req.user);
  }

  @ApiOperation({ summary: 'Rechazar una reserva (solo dueño)' })
  @ApiResponse({ status: 200, description: 'Reserva rechazada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @Patch('owner/:bookingId/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async rejectBooking(
    @Param('bookingId') bookingId: string,
    @Request() req,
  ) {
    return this.bookingsService.rejectBooking(bookingId, req.user);
  }
}

