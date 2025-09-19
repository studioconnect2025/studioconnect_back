import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Studio } from '../studios/entities/studio.entity'; // Importar Studio
import { Booking } from '../bookings/dto/bookings.entity'; // Importar Booking

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Studio, Booking]), // Añadir Studio y Booking
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

