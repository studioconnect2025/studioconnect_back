import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enum/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no hay un decorador @Roles, se permite el acceso.
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
        throw new ForbiddenException('No hay información de usuario para validar roles.');
    }

    const hasPermission = requiredRoles.some((role) => user.role === role);

    if (!hasPermission) {
        throw new ForbiddenException('No tienes los permisos necesarios para este recurso.');
    }

    return true;
  }
}
