import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { Profile } from 'src/profile/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Studio, Booking, Room, Profile])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
