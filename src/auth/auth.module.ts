import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategys/jwt-strategy';
import { GoogleStrategy } from './strategys/google.strategy';
import { JwtRegistrationStrategy } from './strategys/jwt-registration.strategy';
import { JWT_REGISTRATION_SERVICE } from './constants';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    // Asumo que tienes esta configuración de Cache/Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtRegistrationStrategy,
    // ✅ Servicios que faltaban y ahora están añadidos de vuelta
    TokenBlacklistService,
    EmailService,
    // Proveedor personalizado para el JWT de registro
    {
      provide: JWT_REGISTRATION_SERVICE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get<string>('JWT_REGISTRATION_SECRET'),
          signOptions: { expiresIn: '2h' },
        });
      },
    },
  ],
})
export class AuthModule {}