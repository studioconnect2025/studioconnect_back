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
import { EmailService } from 'src/auth/services/email.service';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly fileUploadService: FileUploadService,
    private readonly geocodingService: GeocodingService,
    private readonly emailService: EmailService,
  ) {}

  private readonly logger = new Logger(StudiosService.name);

  // --- MÉTODOS PÚBLICOS ---
  async findAll(): Promise<Studio[]> {
    return this.studioRepository.find();
  }

  async findOne(id: string): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: { rooms: { instruments: true } },
    });
    if (!studio) {
      throw new NotFoundException(`Estudio con ID #${id} no encontrado.`);
    }
    return studio;
  }

  // --- OBTENER URL INLINE DE REGISTRO COMERCIAL ---
  async getComercialRegisterUrl(id: string): Promise<{ inline: string; download: string }> {
    const studio = await this.studioRepository.findOne({ where: { id } });
    
    if (!studio) {
      throw new NotFoundException(`Estudio con ID #${id} no encontrado.`);
    }
    
    if (!studio.comercialRegister) {
      throw new NotFoundException('Este estudio no tiene un registro comercial asignado.');
    }
  
    this.logger.log(`🔍 Buscando PDF con public_id guardado: ${studio.comercialRegister}`);
  
    try {
      // Llamada directa y única al servicio de FileUpload.
      return await this.fileUploadService.getPublicPdfUrl(studio.comercialRegister);
      
    } catch (error) {
      this.logger.error(`❌ No se pudo generar la URL para el registro del estudio ${id}. Error: ${error.message}`);
      
      // Re-lanzamos el error que nos da el servicio (NotFound, InternalServer, etc.)
      throw error;
    }
  }


  // --- MÉTODOS PROTEGIDOS ---
  async findMyStudios(user: User): Promise<Studio[]> {
    return this.studioRepository.find({
      where: { owner: { id: user.id } },
      relations: { rooms: { instruments: true } },
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
    const updatedStudio = await this.studioRepository.save(studio);

    this.emailService.sendProfileUpdateEmail(
      user.email,
      'Estudio',
      updatedStudio.name,
      'Datos del perfil',
    );

    return updatedStudio;
  }

  // --- SUBIR FOTO INDIVIDUAL ---
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

    if ((studio.photos?.length || 0) >= 5) {
      throw new BadRequestException('Ya tienes 5 fotos cargadas.');
    }

    try {
      const result = await this.fileUploadService.uploadFile(file, 'images');
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

    // ✅ Lógica de la rama 'develop': Verificar si el usuario ya tiene un estudio.
    const existingStudio = await this.studioRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (existingStudio) {
      throw new BadRequestException(
        'Ya tienes un estudio registrado. Solo puedes crear uno por dueño.',
      );
    }

    if (files.photos && files.photos.length > 5) {
      throw new BadRequestException('Solo se permiten hasta 5 fotos.');
    }
    
    const { photos, comercialRegister, ...cleanDto } = createStudioDto;

    const studio = this.studioRepository.create({
      ...cleanDto,
      owner: user,
    });

    try {
      const coords = await this.geocodingService.geocodeProfile({
        calle: studio.address,
        ciudad: studio.city,
        provincia: studio.province,
        pais: studio.pais,
        codigoPostal: studio.codigoPostal,
      });

      if (coords) {
        studio.lat = coords.lat;
        studio.lng = coords.lng;
      }
    } catch (error) {
      this.logger.warn(
        `Error al geocodificar estudio ${studio.name}: ${error.message}`,
      );
    }

    if (files.photos) {
      studio.photos = [];
      for (const file of files.photos) {
        const result = await this.fileUploadService.uploadFile(file, 'images');
        studio.photos.push(result.secure_url);
      }
    }

    // ✅ Tu lógica para subir el PDF
    if (files.comercialRegister && files.comercialRegister[0]) {
      const result = await this.fileUploadService.uploadFile(
        files.comercialRegister[0],
        'pdfs',
      );
      studio.comercialRegister = result.public_id;
    }

     const savedStudio = await this.studioRepository.save(studio);

    // ✅ --- CAMBIO IMPORTANTE AQUÍ --- ✅
    // CAMBIO: Anteriormente se enviaba un email de bienvenida.
    // AHORA: Se notifica que el estudio está pendiente de revisión.
    this.emailService.sendStudioPendingReviewEmail(user.email, savedStudio.name);
    
    // Esta notificación al admin sigue siendo correcta.
    this.emailService.sendNewStudioAdminNotification(
      savedStudio.name,
      user.email,
      savedStudio.id,
    );

    return savedStudio;
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

    if (!studio) throw new NotFoundException('Estudio no encontrado.');
    if (studio.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este estudio.',
      );
    }

    Object.assign(studio, dto);

    if (files.photos && files.photos.length > 0) {
      const currentPhotos = studio.photos || [];
      if (currentPhotos.length + files.photos.length > 5) {
        throw new BadRequestException(
          'Solo se permiten hasta 5 fotos en total.',
        );
      }
      for (const file of files.photos) {
        const result = await this.fileUploadService.uploadFile(file, 'images');
        currentPhotos.push(result.secure_url);
      }
      studio.photos = currentPhotos;
    }

    if (files.comercialRegister && files.comercialRegister[0]) {
      const result = await this.fileUploadService.uploadFile(
        files.comercialRegister[0],
        'pdfs',
      );
      studio.comercialRegister = result.public_id;
    }

    const updatedStudio = await this.studioRepository.save(studio);

    this.emailService.sendProfileUpdateEmail(
      user.email,
      'Estudio',
      updatedStudio.name,
      'Datos generales y/o archivos',
    );

    return updatedStudio;
  }
}