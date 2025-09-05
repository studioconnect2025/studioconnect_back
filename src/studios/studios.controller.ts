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
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Studios') // Grupo en Swagger
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) { }

  // --- RUTAS PÚBLICAS ---

  // La ruta para crear estudio ya no es necesaria aqui,
  // por que la creacíon se maneja durante el registro en AuthController.

  @Get()
  @ApiOperation({ summary: 'Obtener todos los estudios' })
  @ApiResponse({ status: 200, description: 'Lista de estudios obtenida con éxito.' })
  findAll() {
    return this.studiosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un estudio por ID' })
  @ApiResponse({ status: 200, description: 'Estudio encontrado correctamente.' })
  @ApiResponse({ status: 404, description: 'Estudio no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.studiosService.findOne(id);
  }

  // --- RUTAS PROTEGIDAS ---
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estudios del dueño autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de estudios del usuario autenticado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  findMyStudio(@Request() req) {
    return this.studiosService.findMyStudio(req.user);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un estudio propio' })
  @ApiResponse({ status: 200, description: 'Estudio actualizado correctamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado para actualizar este estudio.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  updateMyStudio(@Body() updateStudioDto: UpdateStudioDto, @Request() req) 
  {
     //El servicio verificará que el req.user sea el propietario de el estudio con este "id"
    return this.studiosService.updateMyStudio(req.user, updateStudioDto);
  }

  @Post('me/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir foto de un estudio propio' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Foto subida exitosamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado para subir fotos a este estudio.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
  @UploadedFile() file: Express.Multer.File,
  @Request() req,
)
 {
  // El servicio verificará la propiedad antes de subir la foto
  return this.studiosService.uploadPhoto(req.user, file);
}
}
