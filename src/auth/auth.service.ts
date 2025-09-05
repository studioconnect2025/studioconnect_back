import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
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

  private async generateJwtToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
