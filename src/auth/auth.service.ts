// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudioOwnerRegisterDto } from '../users/dto/StudioOwnerRegisterDto'; // Nueva ruta
import { MusicianRegisterDto } from '../Musico/dto/MusicianRegister.dto'; // Nuevo DTO
import { UserRole } from './enum/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { TokenBlacklistService } from './token-blacklist.service';
import { EmailService } from './services/email.service';
import { PerfilMusicalDto } from 'src/Musico/dto/perfil-musical.dto';
import { PreferenciasDto } from 'src/Musico/dto/preferencias.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
  ) {}

  // --- NUEVO MÉTODO PARA REGISTRAR MÚSICOS ---
  async registerMusician(dto: MusicianRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    // Llamamos al servicio de usuarios para crear el usuario con el rol y perfil correctos
    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: UserRole.MUSICIAN, // Rol específico para músicos
      profile: dto.profile,
    });

    await this.emailService.sendWelcomeEmail(dto.profile.nombre, newUser.email);
    return this.generateJwtToken(newUser);
  }

  // --- MÉTODO ACTUALIZADO PARA REGISTRAR DUEÑOS DE ESTUDIO ---
  async registerStudioOwner(dto: StudioOwnerRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    
    // Llamamos al servicio de usuarios para crear el usuario
    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: UserRole.STUDIO_OWNER, // Rol específico para dueños
    });
 
    await this.emailService.sendWelcomeEmail(dto.name, newUser.email);
    return this.generateJwtToken(newUser);
  }

  // --- LÓGICA DE LOGIN (SIN CAMBIOS) ---
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    // Añadido para verificar si el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta de usuario está inactiva.');
    }

    return this.generateJwtToken(user);
  }

  // --- GOOGLE LOGIN (RECOMENDACIÓN DE MEJORA) ---
  // Se recomienda que el frontend envíe el rol deseado después del login con Google
  // para que el usuario pueda elegir si es Músico o Dueño.
  async googleLogin(req: any) {
    if (!req.user) {
      throw new BadRequestException('No se encontró información de usuario de Google.');
    }

    const { email, firstName, lastName } = req.user;
    let user: User;

    try {
      user = await this.usersService.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Al registrar desde Google, el perfil está incompleto.
        // El frontend debería redirigir al usuario para que complete su perfil y elija un rol.
        user = await this.usersService.create({
          email,
          password: Math.random().toString(36).slice(-10), // Contraseña aleatoria y segura
          role: UserRole.MUSICIAN, // O un rol por defecto como 'GUEST'
          profile: {
            nombre: firstName,
            apellido: lastName,
            perfilMusical: new PerfilMusicalDto,
            preferencias: new PreferenciasDto
          },
        });
        await this.emailService.sendWelcomeEmail(firstName, user.email);
      } else {
        throw error;
      }
    }

    return this.generateJwtToken(user);
  }

  private async generateJwtToken(user: User) {
    // Se elimina el perfil del objeto de usuario para no exponerlo en cada login
    const { profile, ...userCoreInfo } = user;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: userCoreInfo, // Devolvemos el usuario sin el perfil detallado
    };
  }
  
  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await this.tokenBlacklistService.blacklist(token, decoded.exp);
    }
    return { message: 'Cierre de sesión exitoso.' };
  }
}