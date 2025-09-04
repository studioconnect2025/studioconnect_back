import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';
import { CreateStudioDto } from './dto/create-stuido.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from 'src/auth/enum/roles.enum'; // Corregida la ruta de importación
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService, // Asumimos que este servicio está inyectado correctamente
  ) {}

  // --- MÉTODOS PÚBLICOS ---

  async findAll(): Promise<Studio[]> {
    return this.studioRepository.find();
  }

  async findOne(id: number): Promise<Studio> {
    const studio = await this.studioRepository.findOneBy({ id });
    if (!studio) {
      throw new NotFoundException(`Estudio con ID #${id} no encontrado.`);
    }
    return studio;
  }

  // --- MÉTODOS PROTEGIDOS (PARA DUEÑOS DE ESTUDIO) ---

  async findMyStudios(user: User): Promise<Studio[]> {
    return this.studioRepository.find({
      where: { owner: { id: user.id } },
    });
  }

  async updateMyStudio(
    user: User,
    studioId: number,
    dto: UpdateStudioDto,
  ): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId, owner: { id: user.id } },
    });

    if (!studio) {
      throw new NotFoundException(
        'No se encontró el estudio o no tienes permiso para editarlo.',
      );
    }

    Object.assign(studio, dto);
    return this.studioRepository.save(studio);
  }

  async uploadPhoto(
    user: User,
    id: number,
    file: Express.Multer.File,
  ): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!studio) {
      throw new NotFoundException('Estudio no encontrado');
    }
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para modificar este estudio');
    }

    const result = await this.fileUploadService.uploadFile(file);
    studio.photos = [...(studio.photos || []), result.secure_url];
    return this.studioRepository.save(studio);
  }

  // --- MÉTODO INTERNO (Usado por AuthService durante el registro) ---

  async create(createStudioDto: CreateStudioDto, user: User): Promise<Studio> {
    if (user.role !== UserRole.STUDIO_OWNER) {
      throw new ForbiddenException(
        'Solo los dueños de estudio pueden crear estudios',
      );
    }

    const studio = this.studioRepository.create({
      ...createStudioDto,
      owner: user,
    });
    return this.studioRepository.save(studio);
  }
}
