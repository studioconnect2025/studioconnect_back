import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Profile } from 'src/profile/entities/profile.entity';

import { Studio } from 'src/studios/entities/studio.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { UserRole } from 'src/auth/enum/roles.enum';
import { BookingStatus } from 'src/bookings/enum/enums-bookings';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  // -------- helper: soporta profile.ubicacion o campos planos --------
  private normalizeProfile(p?: CreateUserDto['profile']) {
    if (!p) return undefined;
    const u: any = (p as any).ubicacion || {};
    const flat = {
      nombre: (p as any).nombre,
      apellido: (p as any).apellido,
      numeroDeTelefono: (p as any).numeroDeTelefono,
      pais: (p as any).pais ?? u.pais,
      ciudad: (p as any).ciudad ?? u.ciudad,
      provincia: (p as any).provincia ?? u.provincia,
      calle: (p as any).calle ?? u.calle,
      codigoPostal: (p as any).codigoPostal ?? u.codigoPostal,
    };
    const hasAny = Object.values(flat).some(
      (v) => v != null && String(v).trim() !== '',
    );
    return hasAny ? flat : undefined;
  }

  // -------- create: usuario + perfil en una transacción --------
  async create(dto: CreateUserDto): Promise<User> {
    const { email, password, confirmPassword } = dto;
    const role = dto.role ?? UserRole.MUSICIAN;
    const profile = this.normalizeProfile(dto.profile);

    if (!email) throw new BadRequestException('Email requerido');
    if (!password) throw new BadRequestException('Password requerida');
    if (confirmPassword != null && confirmPassword !== password) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('El email ya está registrado.');

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      return await this.usersRepository.manager.transaction(async (trx) => {
        const userRepo = trx.getRepository(User);
        const profileRepo = trx.getRepository(Profile);

        // 1) crear usuario
        const user = userRepo.create({ email, passwordHash, role });
        const savedUser = await userRepo.save(user);

        // 2) si hay datos de perfil, asociar y guardar (FK vive en profile.userId)
        if (profile) {
          const prof = profileRepo.create({
            ...profile,
            user: savedUser,
            userId: savedUser.id,
          });
          const savedProfile = await profileRepo.save(prof);
          savedUser.profile = savedProfile;
        }

        const { passwordHash: _omit, ...rest } = savedUser;
        return rest as User;
      });
    } catch (err) {
      this.logger.error('Error creando usuario', err?.stack || err);
      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }
  }

  async updateUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  // ====== Resto de métodos que ya tenías (sin cambios relevantes) ======
  async findOne(user: User): Promise<User> {
    return this.usersRepository.findOneOrFail({
      where: { id: user.id },
      relations: ['bookings', 'studio', 'studio.bookings', 'studio.rooms', 'profile'],
    });
  }

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
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['bookings', 'studio', 'studio.bookings', 'studio.rooms', 'profile'],
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

    if (user.role === UserRole.MUSICIAN) {
      const hasActiveBookings = user.bookings?.some(
        (b) =>
          b.status === BookingStatus.PENDING ||
          b.status === BookingStatus.CONFIRMED,
      );
      if (hasActiveBookings) {
        user.isActive = false;
        await this.usersRepository.save(user);
        return 'Músico desactivado (soft delete)';
      } else {
        await this.usersRepository.remove(user); // ON DELETE CASCADE borrará profile
        return 'Músico eliminado permanentemente';
      }
    }

    if (user.role === UserRole.STUDIO_OWNER) {
      const studio = user.studio;
      if (studio) {
        const hasActiveBookings = studio.bookings?.some(
          (b) =>
            b.status === BookingStatus.PENDING ||
            b.status === BookingStatus.CONFIRMED,
        );
        if (hasActiveBookings) {
          throw new ConflictException(
            'No se puede eliminar: el estudio tiene reservas activas',
          );
        }

        const hasCompletedBookings = studio.bookings?.some(
          (b) => b.status === BookingStatus.COMPLETED,
        );
        if (hasCompletedBookings) {
          user.isActive = false;
          studio.isActive = false;
          if (studio.rooms?.length) {
            for (const room of studio.rooms) room.isActive = false;
          }
          await this.studioRepository.save(studio);
          await this.usersRepository.save(user);
          return 'Dueño y estudio desactivados (soft delete)';
        }

        if (studio.rooms?.length) {
          for (const room of studio.rooms)
            await this.roomRepository.remove(room);
        }
        await this.studioRepository.remove(studio);
        await this.usersRepository.remove(user); // borra profile por CASCADE
        return 'Dueño y estudio eliminados permanentemente';
      } else {
        await this.usersRepository.remove(user); // borra profile por CASCADE
        return 'Dueño eliminado (no tenía estudios)';
      }
    }

    return 'No se pudo eliminar el usuario';
  }

  async softDeleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findOneById(userId);
    user.isActive = false;
    await this.usersRepository.save(user);
    return { message: 'Tu cuenta ha sido desactivada exitosamente.' };
  }

  async toggleOwnStudioStatus(ownerId: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id: ownerId },
      relations: ['studio'],
    });
    if (!user || !user.studio)
      throw new NotFoundException('Estudio no encontrado para este dueño');
    user.studio.isActive = !user.studio.isActive;
    await this.studioRepository.save(user.studio);
    return `Estudio ${user.studio.isActive ? 'activado' : 'desactivado'}`;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const result = await this.usersRepository.update(id, { passwordHash });
    if (result.affected === 0)
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
  }
}
