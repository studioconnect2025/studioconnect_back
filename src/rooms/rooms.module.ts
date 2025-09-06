import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity'; // 1. Importar la entidad que faltaba

@Module({
  // 2. Agregar la entidad a la lista
  imports: [TypeOrmModule.forFeature([Room, Studio, Instruments])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}