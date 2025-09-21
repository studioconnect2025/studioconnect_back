import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pqr, PqrStatus } from './entities/pqr.entity';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { PqrsGateway } from './pqrs.gateway';
import { PqrResponse } from './entities/pqr-response.entity';
import { CreatePqrResponseDto } from './dto/create-pqr-response.dto';
import { EmailService } from 'src/auth/services/email.service';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqr)
    private readonly pqrRepository: Repository<Pqr>,
    
    @InjectRepository(PqrResponse)
    private readonly responseRepository: Repository<PqrResponse>, 

    private readonly usersService: UsersService, 
    
    private readonly pqrsGateway: PqrsGateway,

    private readonly emailService: EmailService,
  ) {}
  // --- FIN DE LA CORRECCIÓN ---

 async create(createPqrDto: CreatePqrDto, createdBy: User): Promise<Pqr> {
    const { subject, description, type, reportedUserId, bookingId } = createPqrDto; // Asumimos que bookingId viene en el DTO
    
    const newPqr = this.pqrRepository.create({
      subject,
      description,
      type,
      createdBy,
    });

    if (reportedUserId) {
      const userToFind = { id: reportedUserId } as User;
      const reportedUser = await this.usersService.findOne(userToFind);
      if (!reportedUser) throw new NotFoundException(`Usuario reportado con ID ${reportedUserId} no encontrado.`);
      newPqr.reportedUser = reportedUser;
    }

    const savedPqr = await this.pqrRepository.save(newPqr);
    this.pqrsGateway.server.to('admin-room').emit('newPqr', savedPqr);

    // 3. Disparar la notificación de nueva PQRS al administrador
    // Nota: El DTO 'createPqrDto' debería incluir el 'bookingId' asociado a la disputa.
    // Usamos la descripción del PQR como el motivo en el correo.
    await this.emailService.sendNewDisputeAdminNotification(
      bookingId || 'N/A', // Opcional, pero recomendado
      createdBy.email,
      savedPqr.description,
    );
    
    return savedPqr;
  }

  async findAll(): Promise<Pqr[]> {
    return this.pqrRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: PqrStatus): Promise<Pqr> {
    const pqr = await this.pqrRepository.findOneBy({ id });
    if (!pqr) throw new NotFoundException(`PQR con ID ${id} no encontrada.`);
    
    pqr.status = status;
    return this.pqrRepository.save(pqr);
  }

  async addResponse(
    pqrId: string,
    responseDto: CreatePqrResponseDto,
    author: User,
  ): Promise<PqrResponse> {
    const pqr = await this.pqrRepository.findOneBy({ id: pqrId });
    if (!pqr) throw new NotFoundException(`PQR con ID ${pqrId} no encontrada.`);

    // Ahora 'this.responseRepository' existe y el código funcionará
    const newResponse = this.responseRepository.create({
      content: responseDto.content,
      author,
      pqr,
    });

    pqr.status = PqrStatus.IN_PROGRESS;
    await this.pqrRepository.save(pqr);
    
    return this.responseRepository.save(newResponse);
  }
}