// pricing.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { Room } from '../rooms/entities/room.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Instruments])],
  providers: [PricingService],
  exports: [PricingService], // 👈 exportar para usar en bookings
})
export class PricingModule {}
