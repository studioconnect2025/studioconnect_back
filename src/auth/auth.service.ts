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
import { StudioOwnerRegisterDto } from 'src/users/dto/owner-register.dto';
import { MusicianRegisterDto } from 'src/users/dto/musician-register.dto';
import { ReactivateAccountDto } from 'src/auth/dto/reactivate-account.dto';
import { UserRole } from './enum/roles.enum';
import { User } from '../users/entities/user.entity';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { ConfigService } from '@nestjs/config';

interface LoginSuccessResponse {
  status: 'LOGIN_SUCCESS';
  data: {
    access_token: string;
    user: Omit<User, 'passwordHash'>;
  };
}

// Esta es la forma del objeto cuando el usuario es nuevo.
interface RegistrationRequiredResponse {
  status: 'REGISTRATION_REQUIRED';
  data: {
    token: string;
  };
}

// Un tipo "unión" que puede ser una de las dos respuestas anteriores.
type GoogleAuthResponse = LoginSuccessResponse | RegistrationRequiredResponse;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // -------- Registro de Músico --------
  async registerMusician(dto: MusicianRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      confirmPassword: dto.confirmPassword,
      role: UserRole.MUSICIAN,            // "Músico"
      profile: dto.profile,               // <-- PASAMOS EL PERFIL
    });

    await this.emailService.sendWelcomeEmail(
      dto.profile?.nombre ?? 'Bienvenido/a',
      newUser.email,
    );

    return this.generateJwtToken(newUser);
  }

  // -------- Registro de Dueño de Estudio --------
  async registerStudioOwner(dto: StudioOwnerRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      confirmPassword: dto.confirmPassword,
      role: UserRole.STUDIO_OWNER,        // "Dueño de Estudio"
      profile: dto.profile,               // <-- PASAMOS EL PERFIL
    });

    await this.emailService.sendWelcomeEmail(
      dto.profile?.nombre ?? 'Bienvenido/a',
      newUser.email,
    );

    return this.generateJwtToken(newUser);
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
          role: roleFromSession || UserRole.MUSICIAN,
        });
        await this.emailService.sendWelcomeEmail(firstName ?? 'Bienvenido/a', user.email);
      } else {
        throw error;
      }
    }

    return this.generateJwtToken(user);
  }

   async handleGoogleAuth(profile: any): Promise<GoogleAuthResponse> { 
    if (!profile) {
      throw new BadRequestException('No se encontró información de usuario de Google.');
    }
    const { email, firstName } = profile;

    try {
      const user = await this.usersService.findOneByEmail(email);

      if (!user.isActive) {
        throw new ForbiddenException({
          message: 'Tu cuenta está inactiva. Por favor, reactívala.',
          error: 'ACCOUNT_INACTIVE',
        });
      }
      
      const loginData = await this.generateJwtToken(user);
      // TypeScript ahora sabe que este objeto coincide con LoginSuccessResponse
      return { status: 'LOGIN_SUCCESS', data: loginData };

    } catch (error) {
      if (error instanceof NotFoundException) {
        const registrationToken = await this.generateRegistrationToken(profile);
        // Y este otro coincide con RegistrationRequiredResponse
        return { status: 'REGISTRATION_REQUIRED', data: { token: registrationToken } };
      }
      throw error;
    }
  }

  async completeGoogleRegistration(googleProfile: any, role: UserRole) {
    const { email, firstName, lastName } = googleProfile;

    const existingUser = await this.usersService.findOneByEmail(email).catch(() => null);
    if (existingUser) {
      throw new BadRequestException('El usuario ya ha sido registrado.');
    }

    // ✅ CORRECCIÓN: Genera la contraseña aleatoria UNA SOLA VEZ
    const randomPassword = Math.random().toString(36).slice(-10);

    const newUser = await this.usersService.create({
      email,
      // ✅ Usa la MISMA variable para ambos campos
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
      return { message: 'Tu cuenta ya se encuentra activa. Puedes iniciar sesión.' };
    }
    user.isActive = true;
    await this.usersService.updateUser(user);
    return { message: 'Tu cuenta ha sido reactivada exitosamente. Ahora puedes iniciar sesión.' };
  }

  // -------- Logout --------
  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await this.tokenBlacklistService.blacklist(token, decoded.exp);
    }
    return { message: 'Cierre de sesión exitoso.' };
  }

  // -------- JWT --------
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
      type: 'GOOGLE_REGISTRATION', // Un 'claim' para identificar el propósito del token
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REGISTRATION_SECRET'),
      expiresIn: '15m', // Haz que expire pronto
    });
  }
}
