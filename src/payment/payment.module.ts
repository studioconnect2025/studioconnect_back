import { Module } from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { PaymentsController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { User } from 'src/users/entities/user.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { PricingModule } from 'src/pricingTotal/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Room, Instruments, User, Studio]),
    PricingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
