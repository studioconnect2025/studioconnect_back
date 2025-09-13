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
    // Obtenemos los roles requeridos para la ruta (ej. [UserRole.MUSICIAN])
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no requiere ningún rol, permite el acceso.
    if (!requiredRoles) {
      return true;
    }

    // Obtenemos el objeto 'user' que el AuthGuard ya adjuntó a la petición.
    const { user } = context.switchToHttp().getRequest();

    // Si no hay usuario o no tiene un rol, deniega el acceso.
    if (!user || !user.role) {
      return false;
    }

    // Comparamos si el rol del usuario está incluido en los roles requeridos.
    // Esta es la única lógica necesaria. NO se necesita una llamada a la base de datos.
    return requiredRoles.some((role) => user.role === role);
  }
}

