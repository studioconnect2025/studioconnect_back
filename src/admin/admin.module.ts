import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Studio } from '../studios/entities/studio.entity';
import { Booking } from '../bookings/dto/bookings.entity';
import { Review } from '../reviews/entities/review.entity'; // Importar Review

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Studio, Booking, Review]), // Añadir Review
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}