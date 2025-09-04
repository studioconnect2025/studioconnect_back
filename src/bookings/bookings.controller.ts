// src/bookings/bookings.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('studios/me/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':ownerId')
  async getMyStudioBookings(@Param('ownerId') ownerId: string) {
    return this.bookingsService.findOwnerBookings(ownerId);
  }
}
