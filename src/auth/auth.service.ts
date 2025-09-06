import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner.dto';
import { StudiosService } from 'src/studios/studios.service';
import { UserRole } from './enum/roles.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private studiosService: StudiosService,
    private jwtService: JwtService,
  ) {}

  async registerStudioOwner(registerDto: StudioOwnerRegisterDto) {
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
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    return this.generateJwtToken(user);
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario de Google no encontrado.');
    }

    // Verifica si el usuario ya existe en tu base de datos
    let user = await this.usersService.findOneByEmail(req.user.email);

    if (!user) {
      // Si no existe, crea un nuevo usuario
      // Se genera una contraseña aleatoria ya que no es necesaria para el login con Google
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        email: req.user.email,
        passwordHash: hashedPassword,
        role: UserRole.STUDIO_OWNER, // Los usuarios de Google son Músicos por defecto
      });
    }

    // Genera y retorna el token JWT para el usuario
    return this.generateJwtToken(user);
  }

 private async generateJwtToken(user: User) {
  // Aseguramos que el ID en el token siempre esté en minúsculas
  const payload = { sub: user.id.toLowerCase(), email: user.email, role: user.role };
  return {
    access_token: await this.jwtService.signAsync(payload),
  };
}
}

