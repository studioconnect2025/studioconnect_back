import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRegistrationGuard extends AuthGuard('jwt-registration') {}