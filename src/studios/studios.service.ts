import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/auth/enum/roles.enum';
import { FileUploadService } from '../file-upload/file-upload.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
    private readonly geocodingService: GeocodingService,
  ) {}

  private readonly logger = new Logger(StudiosService.name);


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

  // --- MÉTODOS PROTEGIDOS ---
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
    const studio = await this.studioRepository.findOne({
      where: { id: studioId, owner: { id: user.id } },
    });

    if (!studio) {
      throw new NotFoundException(
        'No se encontró el estudio o no te pertenece.',
      );
    }

    Object.assign(studio, dto);
    return this.studioRepository.save(studio);
  }

  // --- SUBIR FOTOS INDIVIDUALES ---
  async uploadPhoto(
    user: User,
    id: string,
    file: Express.Multer.File,
  ): Promise<Studio> {
    if (!file) throw new BadRequestException('No se recibió ningún archivo.');

    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado.');
    if (studio.owner.id !== user.id)
      throw new ForbiddenException(
        'No tienes permiso para modificar este estudio.',
      );

    // Validar máximo 5 fotos
    if ((studio.photos?.length || 0) >= 5) {
      throw new BadRequestException('Ya tienes 5 fotos cargadas.');
    }

    try {
      const result = await this.fileUploadService.uploadFile(file);
      studio.photos = [...(studio.photos || []), result.secure_url];
      return this.studioRepository.save(studio);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al subir la imagen: ${error.message}`,
      );
    }
  }

  // --- CREAR ESTUDIO CON ARCHIVOS ---
 async createWithFiles(
  createStudioDto: CreateStudioDto,
  user: User,
  files: {
    photos?: Express.Multer.File[];
    comercialRegister?: Express.Multer.File[];
  },
): Promise<Studio> {
  if (user.role !== UserRole.STUDIO_OWNER) {
    throw new ForbiddenException(
      'Solo los dueños de estudio pueden crear estudios',
    );
  }

  // Validar cantidad máxima de fotos
  if (files.photos && files.photos.length > 5) {
    throw new BadRequestException('Solo se permiten hasta 5 fotos.');
  }

  // 🔹 Clonar DTO y quitar campos que no deben ir directo a create
  const { photos, comercialRegister, ...cleanDto } = createStudioDto;

  const studio = this.studioRepository.create({
    ...cleanDto, // contiene pais, codigoPostal, city, province, address
    owner: user,
  });

  // 🔹 Geocodificar antes de guardar
  try {
    const fullAddress = `${studio.address}, ${studio.city}, ${studio.province}, ${studio.pais}, ${studio.codigoPostal}`;
    const coords = await this.geocodingService.geocode(fullAddress);

    if (coords) {
      studio.lat = coords.lat;
      studio.lng = coords.lng;
    }
  } catch (error) {
    console.warn(
      `No se pudieron obtener coordenadas para el estudio ${studio.name}: ${error.message}`,
    );
  }

  // Subir fotos
  if (files.photos) {
    studio.photos = [];
    for (const file of files.photos) {
      const result = await this.fileUploadService.uploadFile(file);
      studio.photos.push(result.secure_url);
    }
  }

  // Subir registro comercial si existe
  if (files.comercialRegister && files.comercialRegister[0]) {
    const result = await this.fileUploadService.uploadFile(
      files.comercialRegister[0],
    );
    studio.comercialRegister = result.secure_url;
  }

  return this.studioRepository.save(studio);
}



  // --- ACTUALIZAR ESTUDIO CON ARCHIVOS ---
  async updateMyStudioWithFiles(
  user: User,
  studioId: string,
  dto: UpdateStudioDto,
  files: {
    photos?: Express.Multer.File[];
    comercialRegister?: Express.Multer.File[];
  },
): Promise<Studio> {
  const studio = await this.studioRepository.findOne({
    where: { id: studioId },
    relations: ['owner'],
  });

  if (!studio) {
    throw new NotFoundException('Estudio no encontrado.');
  }

  if (studio.owner.id !== user.id) {
    throw new ForbiddenException(
      'No tienes permiso para actualizar este estudio.',
    );
  }

  // --- Actualizar datos básicos
  Object.assign(studio, dto);

  // --- Recalcular coordenadas si cambió la dirección
  const addressParts = [
    studio.address,
    studio.city,
    studio.province,
    studio.pais,
    studio.codigoPostal,
  ].filter(Boolean);

  if (addressParts.length > 0) {
    const fullAddress = addressParts.join(', ');
    try {
      const coords = await this.geocodingService.geocode(fullAddress);
      if (coords) {
        studio.lat = coords.lat;
        studio.lng = coords.lng;
      }
    } catch (error) {
      this.logger.warn(
        `No se pudieron obtener coordenadas para el estudio ${studio.name}: ${error.message}`,
      );
    }
  }

  // --- Manejo de fotos (máx. 5)
  if (files.photos && files.photos.length > 0) {
    const currentPhotos = studio.photos || [];
    if (currentPhotos.length + files.photos.length > 5) {
      throw new BadRequestException(
        'Solo se permiten hasta 5 fotos en total.',
      );
    }
    for (const file of files.photos) {
      const result = await this.fileUploadService.uploadFile(file);
      currentPhotos.push(result.secure_url);
    }
    studio.photos = currentPhotos;
  }

  // --- Manejo del registro comercial
  if (files.comercialRegister && files.comercialRegister[0]) {
    const result = await this.fileUploadService.uploadFile(
      files.comercialRegister[0],
    );
    studio.comercialRegister = result.secure_url;
  }

  return this.studioRepository.save(studio);
}

}
