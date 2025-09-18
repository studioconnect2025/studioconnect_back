// src/auth/strategys/jwt-registration.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRegistrationStrategy extends PassportStrategy(
  Strategy,
  'jwt-registration',
) {
  constructor(private readonly configService: ConfigService) {
    // ✅ Paso 1: Obtenemos el secreto en una variable.
    const secret = configService.get<string>('JWT_REGISTRATION_SECRET');

    // ✅ Paso 2: Verificamos si la variable de entorno existe.
    if (!secret) {
      throw new Error('Falta el secreto JWT_REGISTRATION_SECRET en el archivo .env');
    }
    
   

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // ✅ Paso 3: Pasamos la variable 'secret'.
      // TypeScript ahora sabe que 'secret' no puede ser 'undefined' gracias a la validación de arriba.
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
  return payload;
  }
}