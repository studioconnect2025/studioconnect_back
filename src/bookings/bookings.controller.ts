// src/bookings/bookings.controller.ts
import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtStrategy } from 'src/auth/jwt-strategy';

@Controller('studios/me/bookings')
@UseGuards(JwtStrategy, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':ownerId')
  @Roles(UserRole.STUDIO_OWNER)
  async getMyStudioBookings(@Param('ownerId') ownerId: string) {
    return this.bookingsService.findOwnerBookings(ownerId);
  }

  @Patch(':bookingId/confirm')
  @Roles(UserRole.STUDIO_OWNER)
  async confirmBooking(@Param('bookingId') bookingId: string) {
    return this.bookingsService.confirmBooking(bookingId);
  }

  @Patch(':bookingId/reject')
  @Roles(UserRole.STUDIO_OWNER)
  async rejectBooking(@Param('bookingId') bookingId: string) {
    return this.bookingsService.rejectBooking(bookingId);
  }
}
