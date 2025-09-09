import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner.dto';
import { StudiosService } from 'src/studios/studios.service';
import { UserRole } from './enum/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private studiosService: StudiosService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async registerStudioOwner(registerDto: StudioOwnerRegisterDto) {
    // ... (sin cambios en esta función)
    const { ownerInfo, studioInfo } = registerDto;
    const hashedPassword = await bcrypt.hash(ownerInfo.password, 10);
    const newUser = await this.usersService.create({
      ...ownerInfo,
      passwordHash: hashedPassword,
      role: UserRole.STUDIO_OWNER,
    });
    await this.studiosService.create(studioInfo, newUser);
    return this.generateJwtToken(newUser);
  }

  async login(loginDto: LoginDto) {
    // ... (sin cambios en esta función)
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    return this.generateJwtToken(user);
  }

  // --- MODIFICACIÓN IMPORTANTE AQUÍ ---
  async googleLogin(req: any) {
    if (!req.user) {
      throw new BadRequestException('No se encontró información de usuario de Google.');
    }

    const { email } = req.user;
    let user: User;

    try {
      // 1. Intentamos encontrar al usuario
      user = await this.usersService.findOneByEmail(email);
    } catch (error) {
      // 2. Si el error es 'NotFoundException', significa que no existe y debemos registrarlo
      if (error instanceof NotFoundException) {
        console.log('Usuario no encontrado, procediendo a registrar...');
        
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Creamos el nuevo usuario
        user = await this.usersService.create({
          email,
          passwordHash: hashedPassword,
          role: UserRole.STUDIO_OWNER, // Rol por defecto para usuarios de Google
        });
      } else {
        // 3. Si es un error diferente, lo relanzamos para que no continúe
        throw error;
      }
    }

    // 4. Si el usuario fue encontrado o recién creado, generamos su token
    return this.generateJwtToken(user);
  }


  private async generateJwtToken(user: User) {
    // ... (sin cambios en esta función)
    const payload = {
      sub: user.id.toLowerCase(),
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }

  async logout(token: string) {
    // ... (sin cambios en esta función)
    const decoded = this.jwtService.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await this.tokenBlacklistService.blacklist(token, decoded.exp);
    }
    return { message: 'Cierre de sesión exitoso.' };
  }
}
