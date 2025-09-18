import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MusicianRegisterDto } from 'src/users/dto/musician-register.dto';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner-register.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JWT_REGISTRATION_SERVICE } from './constants';
import { LoginDto } from './dto/login.dto';
import { ReactivateAccountDto } from './dto/reactivate-account.dto';
import { UserRole } from './enum/roles.enum';
import { EmailService } from './services/email.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

// Interfaces para tipado fuerte
interface LoginSuccessResponse {
  status: 'LOGIN_SUCCESS';
  data: {
    access_token: string;
    user: Omit<User, 'passwordHash'>;
  };
}
interface RegistrationRequiredResponse {
  status: 'REGISTRATION_REQUIRED';
  data: {
    token: string;
  };
}
type GoogleAuthResponse = LoginSuccessResponse | RegistrationRequiredResponse;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Inject(JWT_REGISTRATION_SERVICE)
    private readonly jwtRegistrationService: JwtService,
  ) {}

  // -------- Registro de Músico --------
  async registerMusician(dto: MusicianRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const existingUser = await this.usersService.findOneByEmail(dto.email).catch(() => null);

    if (existingUser) {
      // ✅ Si el usuario existe, actualiza su perfil
      const updatedUser = await this.usersService.updateProfile(existingUser.id, dto.profile);
      return this.generateJwtToken(updatedUser);
    } else {
      // Si el usuario no existe, lo crea
      const newUser = await this.usersService.create({
        email: dto.email,
        password: dto.password,
        confirmPassword: dto.confirmPassword,
        role: UserRole.MUSICIAN,
        profile: dto.profile,
      });
      await this.emailService.sendWelcomeEmail(dto.profile?.nombre ?? 'Bienvenido/a', newUser.email);
      return this.generateJwtToken(newUser);
    }
  }

  // -------- Registro de Dueño de Estudio --------
  async registerStudioOwner(dto: StudioOwnerRegisterDto) {
  // 1. Valida que las contraseñas coincidan
  if (dto.password !== dto.confirmPassword) {
    throw new BadRequestException('Las contraseñas no coinciden.');
  }

  // 2. Busca si el usuario ya existe, sin lanzar un error si no lo encuentra
  const existingUser = await this.usersService
    .findOneByEmail(dto.email)
    .catch(() => null);

  if (existingUser) {
    // 3a. Si el usuario existe, actualiza su perfil con los nuevos datos
    const updatedUser = await this.usersService.updateProfile(
      existingUser.id,
      dto.profile,
    );
    // Devuelve un token para el usuario actualizado
    return this.generateJwtToken(updatedUser);
  } else {
    // 3b. Si el usuario no existe, lo crea con los datos proporcionados
    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      confirmPassword: dto.confirmPassword,
      role: UserRole.STUDIO_OWNER,
      profile: dto.profile,
    });

    // Envía un correo de bienvenida al nuevo usuario
    await this.emailService.sendWelcomeEmail(
      dto.profile?.nombre ?? 'Bienvenido/a',
      newUser.email,
    );

    // Devuelve un token para el nuevo usuario
    return this.generateJwtToken(newUser);
  }
}

  // -------- Login --------
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message: 'Tu cuenta está inactiva. Por favor, reactívala para continuar.',
        error: 'ACCOUNT_INACTIVE',
      });
    }

    return this.generateJwtToken(user);
  }

  // -------- Google OAuth --------
  async handleGoogleAuth(profile: any): Promise<GoogleAuthResponse> {
    if (!profile || !profile.email) {
      throw new BadRequestException('No se encontró información de usuario de Google.');
    }
    const { email } = profile;

    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user.isActive) {
        throw new ForbiddenException({
          message: 'Tu cuenta está inactiva. Por favor, reactívala.',
          error: 'ACCOUNT_INACTIVE',
        });
      }
      const loginData = await this.generateJwtToken(user);
      return { status: 'LOGIN_SUCCESS', data: loginData };
    } catch (error) {
      if (error instanceof NotFoundException) {
        const registrationToken = await this.generateRegistrationToken(profile);
        return {
          status: 'REGISTRATION_REQUIRED',
          data: { token: registrationToken },
        };
      }
      throw error;
    }
  }
  
  async completeGoogleRegistration(googleProfile: any, role: UserRole) {
    const { email, firstName, lastName } = googleProfile;
    const existingUser = await this.usersService.findOneByEmail(email).catch(() => null);

    if (existingUser) {
      // ✅ Si el usuario ya existe, simplemente se loguea
      return this.generateJwtToken(existingUser);
    }

    // Si no existe, se crea un nuevo usuario
    const randomPassword = Math.random().toString(36).slice(-10);
    const newUser = await this.usersService.create({
      email,
      password: randomPassword,
      confirmPassword: randomPassword,
      role,
      profile: {
        nombre: firstName,
        apellido: lastName,
      },
    });
    await this.emailService.sendWelcomeEmail(firstName ?? 'Bienvenido/a', newUser.email);
    return this.generateJwtToken(newUser);
  }

  // -------- Reactivar Cuenta --------
  async reactivateAccount(reactivateDto: ReactivateAccountDto): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(reactivateDto.email);
    if (!user) {
      throw new NotFoundException('No se encontró un usuario con ese correo electrónico.');
    }
    if (user.isActive) {
      return {
        message: 'Tu cuenta ya se encuentra activa. Puedes iniciar sesión.',
      };
    }
    user.isActive = true;
    await this.usersService.updateUser(user);
    return {
      message: 'Tu cuenta ha sido reactivada exitosamente. Ahora puedes iniciar sesión.',
    };
  }

  // -------- Logout --------
  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await this.tokenBlacklistService.blacklist(token, decoded.exp);
    }
    return { message: 'Cierre de sesión exitoso.' };
  }

  // -------- Métodos Privados para JWT --------
  private async generateJwtToken(user: User) {
    const { passwordHash, ...userCoreInfo } = user;
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: userCoreInfo,
    };
  }

  private async generateRegistrationToken(profile: any) {
    const payload = {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      type: 'GOOGLE_REGISTRATION',
    };
    return this.jwtRegistrationService.signAsync(payload);
  }
}