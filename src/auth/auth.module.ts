import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { StudiosModule } from 'src/studios/studios.module';
import { JwtStrategy } from './jwt-strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy'; // 1. Importar la GoogleStrategy
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    StudiosModule,
    PassportModule,
    // Configuración asíncrona para leer variables de entorno de forma segura
    JwtModule.registerAsync({
      imports: [ConfigModule], // Importar ConfigModule para usar ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Leer el secret desde .env
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService], // Inyectar ConfigService en la factory
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy], // 2. Añadir GoogleStrategy como provider
})
export class AuthModule {}

