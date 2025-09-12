import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

import { Studio } from 'src/studios/entities/studio.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { UserRole } from 'src/auth/enum/roles.enum';
import { BookingStatus } from 'src/bookings/enum/enums-bookings';
import { Room } from 'src/rooms/entities/room.entity';
import * as bcrypt from 'bcrypt';
import { UpdateMusicianProfileDto } from 'src/Musico/dto/update-musician-profile.dto';

@Injectable()
export class UsersService {
  async updateUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

   async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role, profile } = createUserDto;

    // 1. Verificar si el email ya existe
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('El email ya se encuentra registrado.');
    }

    try {
      // 2. HASHEAR LA CONTRASEÑA (Este es el paso clave que faltaba)
      const passwordHash = await bcrypt.hash(password, 10);

      // 3. Crear la instancia del usuario con 'passwordHash'
      const newUser = this.usersRepository.create({
        email,
        passwordHash, // Usamos la contraseña ya hasheada
        role,
        profile,
      });
      
      // 4. Guardar en la base de datos
      await this.usersRepository.save(newUser);

      // 5. Devolver el usuario sin la contraseña
      const { passwordHash: _, ...userResult } = newUser;
      return userResult as User;

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }
  }

  async findOne(user: User): Promise<User> {
    return this.usersRepository.findOneOrFail({
      where: { id: user.id },
      relations: ['bookings', 'studio', 'studio.bookings', 'studio.rooms'],
    });
  }

  // Buscar usuario por email (obligatorio)
  async findOneByEmail(email: string): Promise<User> {
    if (!email) throw new BadRequestException('El email es obligatorio.');

    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException(
        `Usuario con email "${email}" no encontrado.`,
      );
    }

    return user;
  }

  async findOneById(id: string): Promise<User> {
    if (!id) throw new BadRequestException('El ID es obligatorio.');
    // 👇 Cambia esto de vuelta a la versión simple
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['bookings', 'studio', 'studio.bookings', 'studio.rooms'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return user;
  }

  async softDeleteUser(id: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['bookings', 'studio', 'studio.bookings', 'studio.rooms'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // ----------------- MÚSICO -----------------
    if (user.role === UserRole.MUSICIAN) {
      const hasActiveBookings = user.bookings.some(
        (b) =>
          b.status === BookingStatus.PENDING ||
          b.status === BookingStatus.CONFIRMED,
      );

      if (hasActiveBookings) {
        user.isActive = false; // soft delete
        await this.usersRepository.save(user);
        return 'Músico desactivado (soft delete)';
      } else {
        await this.usersRepository.remove(user); // hard delete
        return 'Músico eliminado permanentemente';
      }
    }

    // ----------------- DUEÑO DE ESTUDIO -----------------
    if (user.role === UserRole.STUDIO_OWNER) {
      const studio = user.studio;

      if (studio) {
        const hasActiveBookings = studio.bookings.some(
          (b) =>
            b.status === BookingStatus.PENDING ||
            b.status === BookingStatus.CONFIRMED,
        );

        if (hasActiveBookings) {
          throw new ConflictException(
            'No se puede eliminar: el estudio tiene reservas activas',
          );
        }

        const hasCompletedBookings = studio.bookings.some(
          (b) => b.status === BookingStatus.COMPLETED,
        );

        if (hasCompletedBookings) {
          // Soft delete: usuario + estudio
          user.isActive = false;
          studio.isActive = false;

          // Desactivar salas
          if (studio.rooms && studio.rooms.length > 0) {
            for (const room of studio.rooms) {
              room.isActive = false;
            }
          }

          await this.studioRepository.save(studio);
          await this.usersRepository.save(user);
          return 'Dueño y estudio desactivados (soft delete)';
        }

        // No hay reservas → eliminar todo permanentemente
        if (studio.rooms && studio.rooms.length > 0) {
          for (const room of studio.rooms) {
            await this.roomRepository.remove(room);
          }
        }
        await this.studioRepository.remove(studio);
        await this.usersRepository.remove(user);
        return 'Dueño y estudio eliminados permanentemente';
      } else {
        // Dueño sin estudio → eliminar usuario
        await this.usersRepository.remove(user);
        return 'Dueño eliminado (no tenía estudios)';
      }
    }

    return 'No se pudo eliminar el usuario';
  }

  async updateUserProfile(userId: string, updateDto: UpdateMusicianProfileDto): Promise<Omit<User, 'passwordHash'>> {
  const user = await this.findOneById(userId);

  if (updateDto.profile) {
    user.profile = Object.assign(user.profile || {}, updateDto.profile);
  }
  
  await this.usersRepository.save(user);
  
  const { passwordHash, ...result } = user;
  
  // Ahora el 'result' coincide perfectamente con el tipo de retorno
  return result;
  }

  // --- NUEVO MÉTODO PARA BORRADO LÓGICO ---
  async softDeleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findOneById(userId);
    
    // Aquí puedes expandir la lógica para manejar reservas activas si es necesario,
    // similar a como lo hiciste en 'softDeleteUser'
    
    user.isActive = false;
    await this.usersRepository.save(user);
    
    return { message: 'Tu cuenta ha sido desactivada exitosamente.' };
  }


  async toggleOwnStudioStatus(ownerId: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id: ownerId },
      relations: ['studio'],
    });

    if (!user || !user.studio) {
      throw new NotFoundException('Estudio no encontrado para este dueño');
    }

    // Cambiar estado de isActive del estudio
    user.studio.isActive = !user.studio.isActive;
    await this.studioRepository.save(user.studio);

    return `Estudio ${user.studio.isActive ? 'activado' : 'desactivado'}`;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const result = await this.usersRepository.update(id, { passwordHash });
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
  }
}
