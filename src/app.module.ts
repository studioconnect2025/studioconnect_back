import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Importación correcta
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstrumentosModule } from './instrumentos/instrumentos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudiosModule } from './studios/studios.module';
import { CategoriesModule } from './categories/categories.module';
import { SeederModule } from './seeder/seeder.module';
import { BookingsModule } from './bookings/bookings.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { RoomsModule } from './rooms/rooms.module';
import { OwnersModule } from './owner/owner.module';
import { OwnersController } from './owner/owner.controller';
import { PaymentsModule } from './payment/payment.module';
import { ProfileModule } from './profile/profile.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ---- MODULO DE SCHEDULE PUESTO EN EL LUGAR CORRECTO ----
    ScheduleModule.forRoot(),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Se quita ScheduleModule de aquí
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        return {
          type: 'postgres',
          url: cfg.get<string>('DATABASE_URL'),
          ssl: { rejectUnauthorized: false },
          extra: { ssl: { rejectUnauthorized: false } },
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    InstrumentosModule,
    UsersModule,
    AuthModule,
    StudiosModule,
    CategoriesModule,
    SeederModule,
    BookingsModule,
    FileUploadModule,
    RoomsModule,
    OwnersModule,
    PaymentsModule,
    ProfileModule,
    GeocodingModule,
    AdminModule,
    ChatModule,
  ],
  controllers: [AppController, OwnersController],
  providers: [AppService],
})
export class AppModule {}

