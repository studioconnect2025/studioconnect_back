import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { UserRole } from '../auth/enum/roles.enum';
import { Studio } from '../studios/entities/studio.entity';
import { Booking } from '../bookings/dto/bookings.entity';
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

 async processStudioRequest(studioId: string, dto: UpdateStudioStatusDto): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
        where: { id: studioId },
        relations: ['owner'] // <-- Asegúrate de cargar la relación 'owner' para obtener su email
    });
    
    if (!studio) {
      throw new NotFoundException(`Estudio con ID "${studioId}" no encontrado.`);
    }

    studio.status = dto.status;

    if (dto.status === StudioStatus.APPROVED) {
      studio.isActive = true;
      studio.rejectionReason = undefined; // Limpiamos la razón si se aprueba
      // (Opcional) Aquí podrías enviar un email de aprobación
      // await this.emailService.sendStudioApprovalEmail(studio.owner.email, studio.name);

    } else if (dto.status === StudioStatus.REJECTED) {
      // Si se rechaza, la razón es obligatoria
      if (!dto.rejectionReason) {
        throw new BadRequestException('Se requiere una razón para el rechazo del estudio.');
      }
      studio.isActive = false;
      studio.rejectionReason = dto.rejectionReason;

      // Enviamos el email al dueño del estudio con la razón
      await this.emailService.sendStudioRejectionEmail(
          studio.owner.email,
          studio.name,
          dto.rejectionReason,
      );
    }

    try {
      return await this.studioRepository.save(studio);
    } catch (error) {
      this.logger.error(`Error al procesar la solicitud del estudio ${studioId}`, error.stack);
      throw new InternalServerErrorException('Error al actualizar el estado del estudio.');
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

