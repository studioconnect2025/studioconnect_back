import {
  Injectable,
  ConflictException,
  NotFoundException,
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

@Injectable()
export class UsersService {
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
    // 👇 Cambia esto de vuelta a la versión simple
    const user = await this.usersRepository.findOneBy({ id: id });
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
}
