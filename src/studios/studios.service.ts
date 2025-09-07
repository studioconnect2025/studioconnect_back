import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/auth/enum/roles.enum';
import { FileUploadService } from '../file-upload/file-upload.service';
import { StudioType } from './enum/studio-type.enum';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // --- MÉTODOS PÚBLICOS ---

  async findAll(): Promise<Studio[]> {
    return this.studioRepository.find();
  }

  async findOne(id: string): Promise<Studio> {
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
    studioId: string,
    dto: UpdateStudioDto,
  ): Promise<Studio> {
    // Se busca el estudio por su ID, asegurando que pertenezca al usuario.
    const studio = await this.studioRepository.findOne({
      where: { id: studioId, owner: { id: user.id } },
    });

    if (!studio) {
      // Mensaje de error más claro de la rama 'develop'.
      throw new NotFoundException(
        'No se encontró el estudio o no te pertenece.',
      );
    }

    Object.assign(studio, dto);
    return this.studioRepository.save(studio);
  }

  async uploadPhoto(
    user: User,
    id: string,
    file: Express.Multer.File,
  ): Promise<Studio> {
    if (!file) {
      throw new Error('El archivo no fue recibido por el servicio.');
    }

    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!studio) {
      throw new NotFoundException('Estudio no encontrado');
    }
    // Se añade esta verificación de seguridad crucial.
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este estudio.',
      );
    }

    try {
      const result = await this.fileUploadService.uploadFile(file);

      studio.photos = [...(studio.photos || []), result.secure_url];

      return this.studioRepository.save(studio);
    } catch (error) {
      // Se mantiene el manejo de errores robusto de 'develop'.
      throw new InternalServerErrorException(
        `Error al subir la imagen: ${error.message}`,
      );
    }
  }

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
