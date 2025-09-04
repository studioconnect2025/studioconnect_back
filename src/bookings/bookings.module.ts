import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Booking } from './dto/bookings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Studio])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
