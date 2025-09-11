import { Module } from '@nestjs/common';
import { InstrumentosService } from './instrumentos.service';
import { InstrumentsController } from './instrumentos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instruments } from './entities/instrumento.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Instruments, Category, Room])],
  controllers: [InstrumentsController],
  providers: [InstrumentosService],
})
export class InstrumentosModule {}
