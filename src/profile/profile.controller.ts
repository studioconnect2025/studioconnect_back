import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enum/roles.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { UpdateMusicianProfileDto } from 'src/musician/dto/update-musician-profile.dto';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,   // lo seguimos usando para DELETE
    private readonly profileService: ProfileService, // nuevo: get/patch del perfil
  ) {}

  @Get('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.', type: Profile })
  async getMyProfile(@Req() req) {
    const userId: string = req.user.id; // viene del JWT que generás
    return this.profileService.getMyProfile(userId);
  }

  @Patch('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado (datos + foto)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: 'Datos opcionales del perfil y archivo opcional de foto',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        nombre: { type: 'string' },
        apellido: { type: 'string' },
        numeroDeTelefono: { type: 'string' },
        ciudad: { type: 'string' },
        provincia: { type: 'string' },
        calle: { type: 'string' },
        codigoPostal: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente.',
    type: Profile,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o archivo faltante.' })
  async updateMyProfile(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateDto: UpdateProfileDto,
  ) {
    const userId: string = req.user.id;

    return this.profileService.updateMyProfile(userId, updateDto, file);
  }

  @Delete('me')
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Desactivar la cuenta del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Cuenta desactivada.' })
  async deleteMyAccount(@Req() req) {
    const userId: string = req.user.id;
    return this.usersService.softDeleteAccount(userId);
  }
}
