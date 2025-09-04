import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstrumentosModule } from './instrumentos/instrumentos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudiosModule } from './studios/studios.module';
import { CategoriesModule } from './categories/categories.module';
import { SeederModule } from './seeder/seeder.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    InstrumentosModule,
    UsersModule,
    AuthModule,
    StudiosModule,
    CategoriesModule,
    SeederModule,
    BookingsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}