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
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/auth/enum/roles.enum'; // Corregida la ruta de importación
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
  ) { }

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

  async findMyStudio(user: User): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
    });
    if (!studio) throw new NotFoundException('No tienes un estudio aún');
    return studio;
  }

  async updateMyStudio(user: User, dto: UpdateStudioDto): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (!studio) {
      throw new NotFoundException('No se encontró tu estudio');
    }

    Object.assign(studio, dto);
    return this.studioRepository.save(studio);
  }

async uploadPhoto(user: User, file: Express.Multer.File) {
  const studio = await this.studioRepository.findOne({
    where: { owner: { id: user.id } },
  });

  if (!studio) throw new NotFoundException('No tienes un estudio creado');

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
