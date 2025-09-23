import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { CreateBookingDto } from './dto/create-booking';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { ReprogramBookingDto } from './dto/reprogram-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // --- ADMIN: obtener todas las reservas ---
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener todas las reservas con filtros y paginación (Admin)',
  })
  async getAllBookingsAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('studioId') studioId?: string,
    @Query('musicianId') musicianId?: string,
  ) {
    return this.bookingsService.getAllBookings({
      page: Number(page),
      limit: Number(limit),
      status,
      studioId,
      musicianId,
    });
  }

  @ApiOperation({ summary: 'Obtener los detalles de una reserva por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la reserva encontrados',
  })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado: la reserva no te pertenece',
  })
  @Get(':bookingId')
  @UseGuards(AuthGuard('jwt'))
  async getBookingById(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: User },
  ) {
    // Llama a un nuevo método en el servicio para encontrar la reserva
    // y verificar que pertenece al usuario logueado.
    return this.bookingsService.findOneBookingForUser(bookingId, req.user);
  }
  // --- RUTA PARA MÚSICOS ---

  @ApiOperation({ summary: 'Crear una nueva reserva (solo músicos)' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para la reserva' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  // CAMBIO AQUÍ: Se documenta el error de rol no autorizado
  @ApiResponse({ status: 403, description: 'Forbidden. Rol no autorizado.' })
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: { user: User },
  ) {
    return this.bookingsService.create(createBookingDto, req.user);
  }

  // --- RUTAS PARA DUEÑOS DE ESTUDIO ---

  @ApiOperation({
    summary: 'Obtener todas las reservas de mis estudios (solo dueño)',
  })
  @ApiResponse({ status: 200, description: 'Lista de reservas recuperada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  // CAMBIO AQUÍ: Se documenta el error de rol no autorizado
  @ApiResponse({ status: 403, description: 'Forbidden. Rol no autorizado.' })
  @Get('owner/my-bookings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  getMyStudioBookings(@Request() req: { user: User }) {
    return this.bookingsService.findOwnerBookings(req.user.id);
  }

  @ApiOperation({ summary: 'Obtener todas mis reservas (solo músicos)' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del músico' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Rol no autorizado' })
  @Get('musician/my-bookings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  getMyBookings(@Request() req: { user: User }) {
    return this.bookingsService.findMusicianBookings(req.user.id);
  }

  @ApiOperation({ summary: 'Confirmar una reserva (solo dueño)' })
  @ApiResponse({ status: 200, description: 'Reserva confirmada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  // CAMBIO AQUÍ: Se documenta el error de rol no autorizado
  @ApiResponse({ status: 403, description: 'Forbidden. Rol no autorizado.' })
  @Patch('owner/:bookingId/confirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: User },
  ) {
    return this.bookingsService.confirmBooking(bookingId, req.user);
  }

  @ApiOperation({ summary: 'Rechazar una reserva (solo dueño)' })
  @ApiResponse({ status: 200, description: 'Reserva rechazada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  // CAMBIO AQUÍ: Se documenta el error de rol no autorizado
  @ApiResponse({ status: 403, description: 'Forbidden. Rol no autorizado.' })
  @Patch('owner/:bookingId/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async rejectBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: User },
  ) {
    return this.bookingsService.rejectBooking(bookingId, req.user);
  }

  @ApiOperation({ summary: 'Cancelar una reserva (solo músico)' }) // ⭐ NEW
  @ApiResponse({ status: 200, description: 'Reserva cancelada correctamente.' }) // ⭐ NEW
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos o fuera de plazo. Solo se puede cancelar hasta 2 días antes de la reserva o ya alcanzaste el límite de cancelaciones diarias.',
  }) // ⭐ NEW
  @ApiResponse({ status: 401, description: 'No autenticado.' }) // ⭐ NEW
  @ApiResponse({
    status: 403,
    description: 'No autorizado: esta reserva no te pertenece.',
  }) // ⭐ NEW
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' }) // ⭐ NEW
  @Patch('musician/:bookingId/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: User },
  ) {
    return this.bookingsService.cancelBooking(bookingId, req.user);
  }

  // ----------------------------
  // ⭐ NEW: Reprogramar reserva (músico)
  // ----------------------------
  @ApiOperation({ summary: 'Reprogramar una reserva (solo músico)' }) // ⭐ NEW
  @ApiResponse({
    status: 200,
    description:
      'Reserva reprogramada correctamente. La reserva vuelve a estado PENDIENTE para que el dueño confirme disponibilidad.',
  }) // ⭐ NEW
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, fuera de plazo (solo hasta 2 días antes) o la reserva ya fue reprogramada anteriormente.',
  }) // ⭐ NEW
  @ApiResponse({ status: 401, description: 'No autenticado.' }) // ⭐ NEW
  @ApiResponse({
    status: 403,
    description: 'No autorizado: esta reserva no te pertenece.',
  }) // ⭐ NEW
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' }) // ⭐ NEW
  @ApiParam({
    name: 'bookingId',
    type: String,
    description: 'ID de la reserva que quieres reprogramar',
  })
  @Patch('musician/:bookingId/reprogram')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  async reprogramBooking(
    @Param('bookingId') bookingId: string,
    @Body() dto: ReprogramBookingDto,
    @Request() req: { user: User },
  ) {
    return this.bookingsService.reprogramBooking(bookingId, req.user, dto);
  }
}
