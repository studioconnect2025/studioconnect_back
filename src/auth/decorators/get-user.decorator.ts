import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se pasa un parámetro (ej. @GetUser('email')), devuelve solo esa propiedad.
    // Si no, devuelve el objeto de usuario completo.
    return data ? user?.[data] : user;
  },
);