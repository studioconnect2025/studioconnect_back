import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-stuido.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  // --- RUTAS PÚBLICAS (Para que cualquiera pueda buscar estudios) ---

  @Get()
  findAll() {
    return this.studiosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studiosService.findOne(id);
  }

  // --- RUTAS PROTEGIDAS (Solo para el Dueño de Estudio autenticado) ---

  // La ruta para crear un estudio ya no es necesaria aquí,
  // porque la creación se maneja durante el registro en AuthController.

  @Get('me/my-studios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  findMyStudios(@Request() req) {
    // El servicio se encargará de encontrar los estudios asociados al req.user.id
    return this.studiosService.findMyStudios(req.user);
  }

  @Patch('me/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  updateMyStudio(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudioDto: UpdateStudioDto,
    @Request() req,
  ) {
    // El servicio verificará que el req.user sea el propietario del estudio con ese 'id'
    return this.studiosService.updateMyStudio(req.user, id, updateStudioDto);
  }

  @Post('me/:id/photos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    // El servicio verificará la propiedad antes de subir la foto
    return this.studiosService.uploadPhoto(req.user, id, file);
  }
}

