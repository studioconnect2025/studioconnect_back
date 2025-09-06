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
  ParseUUIDPipe,
} from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-stuido.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
// CAMBIO AQUÍ: Se importa ApiBody
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody 
} from '@nestjs/swagger';

@ApiTags('Studios')
@ApiBearerAuth()
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  // --- RUTAS PÚBLICAS ---
  
  @Get()
  @ApiOperation({ summary: 'Obtener todos los estudios' })
  @ApiResponse({ status: 200, description: 'Lista de estudios obtenida con éxito.' })
  findAll() {
    return this.studiosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un estudio por ID' })
  @ApiResponse({ status: 200, description: 'Estudio encontrado.' })
  @ApiResponse({ status: 404, description: 'Estudio no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studiosService.findOne(id);
  }

  // --- RUTAS PROTEGIDAS PARA DUEÑOS DE ESTUDIO ---

  @Get('me/my-studios')
  @ApiOperation({ summary: 'Obtener estudios del dueño autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de estudios del usuario.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  findMyStudios(@Request() req) {
    return this.studiosService.findMyStudios(req.user);
  }

  @Patch('me/:id')
  @ApiOperation({ summary: 'Actualizar un estudio propio' })
  @ApiResponse({ status: 200, description: 'Estudio actualizado.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  updateMyStudio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudioDto: UpdateStudioDto,
    @Request() req,
  ) {
    return this.studiosService.updateMyStudio(req.user, id, updateStudioDto);
  }

  @Post('me/:id/photos')
  @ApiOperation({ summary: 'Subir foto de un estudio propio' })
  @ApiConsumes('multipart/form-data')
  // CAMBIO AQUÍ: Se agrega @ApiBody para describir el campo del archivo
  @ApiBody({
    description: 'Archivo de imagen del estudio',
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
  @ApiResponse({ status: 201, description: 'Foto subida exitosamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string, 
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.studiosService.uploadPhoto(req.user, id, file);
  }
}