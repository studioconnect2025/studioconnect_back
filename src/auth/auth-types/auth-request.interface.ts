// src/auth/types/auth-request.interface.ts
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface AuthRequest extends Request {
  user: User; // ahora req.user está tipado
}
