import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './dto/bookings.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { PricingModule } from 'src/pricingTotal/pricing.module';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { EmailModule } from 'src/auth/modules/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Studio, User, Room, Instruments]),
    PricingModule, EmailModule 
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
