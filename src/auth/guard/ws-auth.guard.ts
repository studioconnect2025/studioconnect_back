import { CanActivate, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service'; // Asegúrate de que la ruta sea correcta
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly authService: AuthService) {} // Inyecta tu AuthService

  canActivate(
    context: any,
  ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
    const client: Socket = context.switchToWs().getClient();
    const authToken = client.handshake?.headers?.authorization?.split(' ')[1];

    if (!authToken) {
      this.logger.error('No se encontró token de autorización en el handshake.');
      client.disconnect();
      return false;
    }

    try {
      // Usamos tu AuthService para validar el token y obtener el usuario
      const user: User = this.authService.verifyTokenAndGetUser(authToken); // DEBES CREAR ESTE MÉTODO
      if (!user) {
        client.disconnect();
        return false;
      }
      // ¡Muy importante! Adjuntamos el usuario al objeto del socket
      client.data.user = user;
      return true;
    } catch (error) {
      this.logger.error('Error de autenticación de WebSocket:', error.message);
      client.disconnect();
      return false;
    }
  }
}