import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { Booking } from 'src/bookings/dto/bookings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Studio, Booking]),
    FileUploadModule, // Importar el módulo de subida de archivos
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}