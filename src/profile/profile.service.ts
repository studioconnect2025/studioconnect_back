import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Crea un Profile 1–1 para el usuario dado.
   * Usa valores por defecto para columnas NOT NULL.
   */
  async createForUser(userId: string, dto: CreateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existing = await this.profileRepo.findOne({ where: { userId } });
    if (existing) throw new ConflictException('El usuario ya tiene un perfil');

    // Defaults para evitar 23502 (NOT NULL) en DB
    const safe: Required<Omit<CreateProfileDto, 'userId'>> & {
      userId: string;
    } = {
      nombre: dto?.nombre ?? '',
      apellido: dto?.apellido ?? '',
      numeroDeTelefono: dto?.numeroDeTelefono ?? '',
      ciudad: dto?.ciudad ?? '',
      provincia: dto?.provincia ?? '',
      calle: dto?.calle ?? '',
      codigoPostal: dto?.codigoPostal ?? '',
      userId,
    };

    const entity = this.profileRepo.create(safe);
    try {
      return await this.profileRepo.save(entity);
    } catch (e: any) {
      if (e?.code === '23505') {
        // unique_violation (por userId unique)
        throw new ConflictException('Ya existe un perfil para este usuario');
      }
      throw e;
    }
  }

  /**
   * Devuelve el perfil del usuario logueado.
   */
  async getMyProfile(userId: string) {
    if (!userId) throw new BadRequestException('userId requerido');

    const userExists = await this.userRepo.exist({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    return profile;
  }

  /**
   * Actualiza el perfil del usuario logueado.
   * Ignora id/userId del DTO para no permitir cambiarlos.
   */
 async updateMyProfile(
  userId: string,
  dto: UpdateProfileDto,
  file?: Express.Multer.File,
) {
  if (!userId) throw new BadRequestException('userId requerido');

  const userExists = await this.userRepo.exist({ where: { id: userId } });
  if (!userExists) throw new NotFoundException('Usuario no encontrado');

  const profile = await this.profileRepo.findOne({ where: { userId } });
  if (!profile) throw new NotFoundException('Perfil no encontrado');

  const { id: _ignoreId, userId: _ignoreUserId, ...safe } = dto as any;

  // --- Campos básicos (texto) ---
  const patch = {
    ...(safe.nombre !== undefined ? { nombre: safe.nombre ?? '' } : {}),
    ...(safe.apellido !== undefined ? { apellido: safe.apellido ?? '' } : {}),
    ...(safe.numeroDeTelefono !== undefined
      ? { numeroDeTelefono: safe.numeroDeTelefono ?? '' }
      : {}),
    ...(safe.ciudad !== undefined ? { ciudad: safe.ciudad ?? '' } : {}),
    ...(safe.provincia !== undefined ? { provincia: safe.provincia ?? '' } : {}),
    ...(safe.calle !== undefined ? { calle: safe.calle ?? '' } : {}),
    ...(safe.codigoPostal !== undefined ? { codigoPostal: safe.codigoPostal ?? '' } : {}),
  };

  Object.assign(profile, patch);

  // --- Foto de perfil ---
  if (file) {
    // 1. Subir nueva
    const uploadResult = await this.fileUploadService.uploadFile(file, 'profile_pictures');

    // 2. Eliminar anterior si existía
    if (profile.profileImagePublicId) {
      await this.fileUploadService.deleteFile(profile.profileImagePublicId);
    }

    // 3. Setear datos nuevos
    profile.profileImageUrl = uploadResult.secure_url;
    profile.profileImagePublicId = uploadResult.public_id;
  }

  return this.profileRepo.save(profile);
}

}
