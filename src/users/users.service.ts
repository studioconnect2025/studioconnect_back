import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('El email ya se encuentra registrado.');
    }

    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOneBy({ email });
    return user ?? undefined;
  }

   async findOneById(id: string): Promise<User> {
  const user = await this.usersRepository.findOneBy({ id: id }); 
  if (!user) {
    throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
  }
  return user;
}

  async updatePassword(id: string, passwordHash: string): Promise<void> {
  const result = await this.usersRepository.update(id, { passwordHash });
  if (result.affected === 0) {
    throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
  }
}
}
