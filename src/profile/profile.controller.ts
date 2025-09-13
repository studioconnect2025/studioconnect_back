import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enum/roles.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { UpdateMusicianProfileDto } from '../musician/dto/update-musician-profile.dto'; // Ruta corregida
import { User } from '../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.', type: User })
  async getMyProfile(@Req() req) {
    const userId = req.user.id;
    const user = await this.usersService.findOneById(userId);
    const { passwordHash, ...result } = user;
    return result;
  }

  

  @Patch('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente.',
    type: User,
  })
  @ApiBody({
    type: UpdateMusicianProfileDto,
    description:
      'Estructura de datos para actualizar el perfil. Todos los campos son opcionales.',
    examples: {
      ejemplo: {
        summary: 'Actualizar datos personales y de ubicación',
        value: {
          profile: {
            nombre: 'Carlos Alberto',
            apellido: 'Ruiz',
            numeroDeTelefono: '+5491187654321',
            ciudad: 'La Plata',
            provincia: 'Buenos Aires',
            calle: 'Av. Siempreviva 742',
            codigoPostal: 'B1900',
          },
        },
      },
    },
  })

  async updateMyProfile(
    @Req() req,
    @Body() updateDto: UpdateMusicianProfileDto,
  ) {
    const userId = req.user.id;
    return this.usersService.updateUserProfile(userId, updateDto);
  }

  @Delete('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Desactivar la cuenta del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Cuenta desactivada.' })
  async deleteMyAccount(@Req() req) {
    const userId = req.user.id;
    return this.usersService.softDeleteAccount(userId);
  }


   @Patch('me/picture')
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el form-data
  @ApiOperation({ summary: 'Actualizar la foto de perfil del usuario' })
  @ApiConsumes('multipart/form-data') // Especifica el tipo de contenido para Swagger
  @ApiBody({
    description: 'Archivo de imagen para la foto de perfil',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada exitosamente.'})
  @ApiResponse({ status: 400, description: 'No se proporcionó un archivo o el formato es incorrecto.'})
  async updateProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }
    
    const userId = req.user.id;
    return this.usersService.updateProfilePicture(userId, file);
  }
}
