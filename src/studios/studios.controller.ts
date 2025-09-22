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
  UploadedFiles,
  ParseUUIDPipe,
  UploadedFile,
} from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ServicesType } from './enum/ServicesType.enum';
import { StudioTypeEnum } from './enum/studio-type.enum';

@ApiTags('Studios')
@ApiBearerAuth()
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  // --- RUTAS PÚBLICAS ---
  @Get()
  @ApiOperation({ summary: 'Obtener todos los estudios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de estudios obtenida con éxito.',
  })
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

  // --- 📄 OBTENER COMERCIAL REGISTER INLINE ---
  @Get(':id/comercial-register')
  @ApiOperation({ summary: 'Obtener URL segura del registro comercial (PDF)' })
  @ApiResponse({
    status: 200,
    description: 'Devuelve una URL firmada para visualizar el PDF inline.',
  })
  async getComercialRegister(@Param('id', ParseUUIDPipe) id: string) {
    return this.studiosService.getComercialRegisterUrl(id);
  }


  
  // --- RUTAS PROTEGIDAS PARA DUEÑOS DE ESTUDIO ---
  @Get('me/my-studios')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener estudios del dueño autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de estudios del usuario.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  findMyStudios(@Request() req) {
    return this.studiosService.findMyStudios(req.user);
  }

  // --- CREAR ESTUDIO CON ARCHIVOS ---
  @Post('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un estudio propio con fotos y registro comercial',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del estudio con archivos',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        studioType: { type: 'string', enum: Object.values(StudioTypeEnum) },
        pais: { type: 'string' },
        codigoPostal: { type: 'string' },
        city: { type: 'string' },
        province: { type: 'string' },
        address: { type: 'string' },
        description: { type: 'string' },
        services: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(ServicesType),
          },
        },
        openingTime: { type: 'string', example: '09:30' },
        closingTime: { type: 'string', example: '21:00' },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        comercialRegister: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Estudio creado exitosamente.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photos', maxCount: 5 },
      { name: 'comercialRegister', maxCount: 1 },
    ]),
  )
  createMyStudioWithFiles(
    @Body() createStudioDto: CreateStudioDto,
    @UploadedFiles()
    files: {
      photos?: Express.Multer.File[];
      comercialRegister?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    return this.studiosService.createWithFiles(
      createStudioDto,
      req.user,
      files,
    );
  }

  // --- ACTUALIZAR ESTUDIO CON ARCHIVOS ---
  @Patch('me/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar un estudio propio con fotos y registro comercial',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Actualizar estudio con archivos',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        studioType: { type: 'string', enum: Object.values(StudioTypeEnum) },
        pais: { type: 'string' },
        codigoPostal: { type: 'string' },
        city: { type: 'string' },
        province: { type: 'string' },
        address: { type: 'string' },
        description: { type: 'string' },
        services: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(ServicesType),
          },
        },
        openingTime: { type: 'string', example: '09:30' },
        closingTime: { type: 'string', example: '21:00' },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        comercialRegister: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estudio actualizado exitosamente.',
  })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photos', maxCount: 5 },
      { name: 'comercialRegister', maxCount: 1 },
    ]),
  )
  updateMyStudioWithFiles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudioDto: UpdateStudioDto,
    @UploadedFiles()
    files: {
      photos?: Express.Multer.File[];
      comercialRegister?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    return this.studiosService.updateMyStudioWithFiles(
      req.user,
      id,
      updateStudioDto,
      files,
    );
  }

  // --- SUBIR FOTO INDIVIDUAL ---
  @Post('me/:id/photos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subir foto de un estudio propio' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen del estudio',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
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
