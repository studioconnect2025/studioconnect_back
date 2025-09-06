import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

