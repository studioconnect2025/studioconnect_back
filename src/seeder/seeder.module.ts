import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Instruments, Category, Booking])],
  controllers: [SeederController],
  providers: [SeederService],
})
export class SeederModule {}
