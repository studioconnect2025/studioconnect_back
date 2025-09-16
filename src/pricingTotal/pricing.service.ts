// pricing.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Room } from '../rooms/entities/room.entity';
import { Repository, In } from 'typeorm';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Instruments)
    private readonly instrumentRepo: Repository<Instruments>,
  ) {}

  async calculatePrice(
    roomId: string,
    startTime: Date,
    endTime: Date,
    instrumentIds?: string[],
  ) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['studio'],
    });
    if (!room) throw new NotFoundException('Sala no encontrada');

    // 🔹 Calcular horas
    const hours =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) /
      (1000 * 60 * 60);
    if (hours <= 0) throw new Error('Horas inválidas');

    // 🔹 Precio sala
    const roomPrice = Number(room.pricePerHour) * hours;

    // 🔹 Precio instrumentos
    let instrumentsPrice = 0;
    let instrumentsList: Instruments[] = [];
    if (instrumentIds?.length) {
      instrumentsList = await this.instrumentRepo.find({
        where: { id: In(instrumentIds) },
      });
      instrumentsPrice = instrumentsList.reduce((sum, i) => sum + i.price, 0);
    }

    // 🔹 Comisiones y totales
    const roomCommission = roomPrice * 0.15;
    const roomOwnerAmount = roomPrice * 0.85;
    const instrumentsAmount = instrumentsPrice;
    const totalPrice = roomPrice + instrumentsPrice;

    console.log({
      totalPrice,
      roomPrice,
      instrumentsPrice,
      roomCommission,
      roomOwnerAmount,
      instrumentsAmount,
      instrumentsList,
      room,
    });

    return {
      totalPrice,
      roomPrice,
      instrumentsPrice,
      roomCommission,
      roomOwnerAmount,
      instrumentsAmount,
      instrumentsList,
      room,
    };
  }
}
