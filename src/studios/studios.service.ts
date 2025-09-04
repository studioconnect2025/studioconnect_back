import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { User } from '../users/user.entity';
import { UserRole } from '../users/roles.enum'; // Corregida la ruta de importación
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async updateMyStudio(
    user: User,
    studioId: number,
    dto: UpdateStudioDto,
  ): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id: studioId, owner: { id: user.id } },
    });

    if (!studio) {
      throw new NotFoundException('No se encontró el estudio o no es tuyo');
    }

    Object.assign(studio, dto);
    return this.studioRepository.save(studio);
  }

  async findMyStudios(user: User): Promise<Studio[]> {
    return this.studioRepository.find({
      where: { owner: { id: user.id } },
    });
  }

  async uploadPhoto(user, id: number, file: Express.Multer.File) {
    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    if (studio.owner.id !== user.id)
      throw new ForbiddenException('No eres dueño de este estudio');

    const result = await this.fileUploadService.uploadFile(file);

    studio.photos = [...(studio.photos || []), result.secure_url];
    return this.studioRepository.save(studio);
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

