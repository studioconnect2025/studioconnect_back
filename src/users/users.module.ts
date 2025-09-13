import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { ProfileController } from '../profile/profile.controller';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Studio, Booking, Room]) , FileUploadModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService], // 1. Declara el servicio como parte de este módulo
  exports: [UsersService, TypeOrmModule], // 2. Exporta el servicio para que otros módulos puedan usarlo
})
export class UsersModule {}
