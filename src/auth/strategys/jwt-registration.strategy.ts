import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common'; 
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRegistrationStrategy extends PassportStrategy(Strategy, 'jwt-registration') {
  constructor(configService: ConfigService) {
    const registrationSecret = configService.get<string>('JWT_REGISTRATION_SECRET');

    if (!registrationSecret) {
      throw new InternalServerErrorException(
        'El secreto para JWT de registro no está definido en las variables de entorno.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: registrationSecret, 
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'GOOGLE_REGISTRATION') {
      throw new UnauthorizedException('Token no válido para esta operación.');
    }
    return {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      picture: payload.picture,
    };
  }
}