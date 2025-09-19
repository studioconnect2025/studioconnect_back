import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enum/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Si no se especifican roles, se permite el acceso.
    }

    // --- INICIO DE LA CORRECCIÓN ---
    let user;

    // Verificamos el tipo de contexto (HTTP o WebSocket)
    if (context.getType() === 'http') {
      // Si es HTTP, obtenemos el usuario del request.
      user = context.switchToHttp().getRequest().user;
    } else if (context.getType() === 'ws') {
      // Si es WebSocket, obtenemos el usuario del cliente del socket.
      // (Esto asume que tu WsAuthGuard ya lo ha añadido a 'client.data')
      user = context.switchToWs().getClient().data.user;
    }
    // --- FIN DE LA CORRECCIÓN ---

    if (!user) {
      throw new ForbiddenException(
        'No hay información de usuario para validar roles.',
      );
    }

    const hasPermission = requiredRoles.some((role) => user.role === role);

    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para este recurso.',
      );
    }

    return true;
  }
}