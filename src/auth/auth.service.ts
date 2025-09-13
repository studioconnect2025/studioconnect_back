// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudioOwnerRegisterDto } from 'src/users/dto/StudioOwnerRegisterDto';
import { MusicianRegisterDto } from 'src/musician/dto/musician-register.dto';
import { ReactivateAccountDto } from 'src/auth/dto/reactivate-account.dto';
import { UserRole } from './enum/roles.enum';
import { User } from '../users/entities/user.entity';
import { TokenBlacklistService } from './token-blacklist.service';
import { EmailService } from './services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
  ) {}

  

  async registerMusician(dto: MusicianRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: UserRole.MUSICIAN,
      profile: dto.profile,
    });

    await this.emailService.sendWelcomeEmail(dto.profile.nombre, newUser.email);
    return this.generateJwtToken(newUser);
  }

  async registerStudioOwner(dto: StudioOwnerRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    
    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: UserRole.STUDIO_OWNER,
    });
 
    await this.emailService.sendWelcomeEmail(dto.name, newUser.email);
    return this.generateJwtToken(newUser);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Corregido: Se añade la verificación de cuenta inactiva
    if (!user.isActive) {
      throw new ForbiddenException({
        message: 'Tu cuenta está inactiva. Por favor, reactívala para continuar.',
        error: 'ACCOUNT_INACTIVE',
      });
    }

    return this.generateJwtToken(user);
  }

  async googleLogin(req: any, roleFromSession?: UserRole) {
    if (!req.user) {
      throw new BadRequestException('No se encontró información de usuario de Google.');
    }

    const { email, firstName } = req.user;
    let user: User;

    try {
      user = await this.usersService.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        user = await this.usersService.create({
          email,
          password: Math.random().toString(36).slice(-10),
          role: roleFromSession || UserRole.MUSICIAN, // Usa el rol de la sesión o uno por defecto
        });
        await this.emailService.sendWelcomeEmail(firstName, user.email);
      } else {
        throw error;
      }
    }

    return this.generateJwtToken(user);
  }

  async reactivateAccount(reactivateDto: ReactivateAccountDto): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(reactivateDto.email);

    if (!user) {
      throw new NotFoundException('No se encontró un usuario con ese correo electrónico.');
    }

    if (user.isActive) {
      return { message: 'Tu cuenta ya se encuentra activa. Puedes iniciar sesión.' };
    }

    user.isActive = true;
    await this.usersService.updateUser(user);

    return { message: 'Tu cuenta ha sido reactivada exitosamente. Ahora puedes iniciar sesión.' };
  }
  
  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await this.tokenBlacklistService.blacklist(token, decoded.exp);
    }
    return { message: 'Cierre de sesión exitoso.' };
  }

  private async generateJwtToken(user: User) {
    const { profile, passwordHash, ...userCoreInfo } = user;
    const payload = {
      id: user.id, // Corregido: se usa 'id' para consistencia con el resto de la app
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: userCoreInfo,
    };
  }
}