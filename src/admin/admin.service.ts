import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { UserRole } from '../auth/enum/roles.enum';
import { Studio } from '../studios/entities/studio.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { StudioStatus } from '../studios/enum/studio-status.enum';
import { EmailService } from '../auth/services/email.service';
import { UpdateStudioStatusDto } from './dto/update-studio-status';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Studio) private readonly studioRepository: Repository<Studio>,
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
     private readonly emailService: EmailService,
  ) {}

  // --- MÉTODOS DE USUARIOS ---
  async findAllUsers() {
    try {
      const users = await this.usersRepository.find({
        relations: ['profile', 'studio'],
      });
      return users.map((user) => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      this.logger.error('Error al obtener todos los usuarios', error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los usuarios.');
    }
  }
  
  private async findUsersByRole(roles: UserRole[]) {
    try {
      const users = await this.usersRepository.find({
        where: {
          role: In(roles), 
        },
        relations: ['profile', 'studio'], 
      });
      return users.map((user) => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      this.logger.error(`Error al obtener usuarios por roles: ${roles.join(', ')}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los usuarios.');
    }
  }

  async findAllMusicians() {
    return this.findUsersByRole([UserRole.MUSICIAN]);
  }

  async findAllStudioOwners() {
    return this.findUsersByRole([UserRole.STUDIO_OWNER]);
  }

  
  
  async findAllActiveUsers() {
    try {
      const users = await this.usersRepository.find({ where: { isActive: true }, relations: ['profile', 'studio'] });
      return users.map(({ passwordHash, ...user }) => user);
    } catch (error) {
      this.logger.error('Error al obtener usuarios activos', error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los usuarios activos.');
    }
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    user.isActive = !user.isActive;

    try {
      const savedUser = await this.usersRepository.save(user);
      const { passwordHash, ...result } = savedUser;
      return result as User;
    } catch (error) {
      this.logger.error(`Error al cambiar el estado del usuario ${userId}`, error.stack);
      throw new InternalServerErrorException('Error al actualizar el estado del usuario.');
    }
  }

  // --- MÉTODOS DE ESTUDIOS ---
  async findAllActiveStudios() {
    try {
      return await this.studioRepository.find({ where: { isActive: true }, relations: ['owner', 'rooms'] });
    } catch (error) {
      this.logger.error('Error al obtener estudios activos', error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los estudios activos.');
    }
  }

  async findPendingStudioRequests() {
    try {
      return await this.studioRepository.find({ where: { status: StudioStatus.PENDING }, relations: ['owner'] });
    } catch (error) {
      this.logger.error('Error al obtener solicitudes de estudio pendientes', error.stack);
      throw new InternalServerErrorException('No se pudieron obtener las solicitudes pendientes.');
    }
  }

  async processStudioRequest(
    studioId: string,
    dto: UpdateStudioStatusDto,
  ): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId },
      relations: ['owner'], // Cargar la relación con el dueño
    });

    if (!studio) {
      throw new NotFoundException(`Estudio con ID "${studioId}" no encontrado.`);
    }

    if (!studio.owner) {
      throw new InternalServerErrorException(
        'El estudio no tiene un dueño asociado. No se puede notificar.',
      );
    }

    studio.status = dto.status;

    // Lógica para manejar cada estado
    if (dto.status === StudioStatus.APPROVED) {
      studio.isActive = true;
      studio.rejectionReason = undefined; // Limpiar motivo de rechazo si existía
      
      // Enviar email de aprobación
      await this.emailService.sendStudioApprovedEmail(
        studio.owner.email,
        studio.name,
        studio.id,
      );

    } else if (dto.status === StudioStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('El motivo de rechazo es obligatorio.');
      }
      studio.isActive = false;
      studio.rejectionReason = dto.rejectionReason;

      // Enviar email de rechazo
      await this.emailService.sendStudioRejectionEmail(
        studio.owner.email,
        studio.name,
        dto.rejectionReason,
      );

    } else if (dto.status === StudioStatus.PENDING) {
      studio.isActive = false; // Un estudio pendiente no debería estar activo
    }

    try {
      return await this.studioRepository.save(studio);
    } catch (error) {
      this.logger.error(
        `Error al procesar la solicitud del estudio ${studioId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al actualizar el estado del estudio.',
      );
    }
  }

  // --- MÉTODOS DE RESERVAS ---
  async findAllBookings() {
    try {
      return await this.bookingRepository.find({ relations: ['musician', 'studio', 'room'] });
    } catch (error) {
      this.logger.error('Error al obtener todas las reservas', error.stack);
      throw new InternalServerErrorException('No se pudieron obtener las reservas.');
    }
  }
}

