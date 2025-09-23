import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe, // 🔥 1. IMPORTAR ParseIntPipe
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateImageOrderDto } from './dto/update-room.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Room } from './entities/room.entity';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // ... (los endpoints createRoom, createRoomInStudio, updateRoom, deleteRoom, findRoomsByStudio y findMyRooms no cambian)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({
    summary: 'Crear una sala (studioId se obtiene automáticamente del usuario)',
  })
  @ApiResponse({
    status: 201,
    description: 'Sala creada correctamente',
    type: Room,
  })
  createRoom(@Body() dto: CreateRoomDto, @Request() req) {
    return this.roomsService.createWithAutoStudio(dto, req.user);
  }

  @Post(':studioId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Crear una sala en un estudio específico' })
  @ApiParam({ name: 'studioId', description: 'ID del estudio' })
  @ApiResponse({
    status: 201,
    description: 'Sala creada correctamente',
    type: Room,
  })
  createRoomInStudio(
    @Param('studioId') studioId: string,
    @Body() dto: CreateRoomDto,
    @Request() req,
  ) {
    return this.roomsService.create(dto, req.user, studioId);
  }

  @Patch(':roomId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar una sala existente' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiResponse({
    status: 200,
    description: 'Sala actualizada correctamente',
    type: Room,
  })
  updateRoom(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
    @Request() req,
  ) {
    return this.roomsService.update(roomId, dto, req.user);
  }

  @Delete(':roomId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Eliminar una sala' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiResponse({ status: 204, description: 'Sala eliminada correctamente' })
  deleteRoom(@Param('roomId') roomId: string, @Request() req) {
    return this.roomsService.remove(roomId, req.user);
  }

  @Get('studio/:studioId')
  @ApiOperation({ summary: 'Obtener todas las salas de un estudio' })
  @ApiParam({ name: 'studioId', description: 'ID del estudio' })
  @ApiResponse({ status: 200, description: 'Listado de salas', type: [Room] })
  findRoomsByStudio(@Param('studioId') studioId: string) {
    return this.roomsService.findRoomsByStudio(studioId);
  }

  @Get('my-rooms')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Obtener todas las salas del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Listado de salas del usuario',
    type: [Room],
  })
  findMyRooms(@Request() req) {
    return this.roomsService.findRoomsByUser(req.user);
  }


  // ===================== ENDPOINTS DE IMÁGENES =====================

  @Post(':roomId/images')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos de imagen'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por archivo
      },
    }),
  )
  @ApiOperation({ summary: 'Subir imágenes a una sala' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imágenes de la sala (máximo 5)',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imágenes subidas correctamente',
    type: Room,
  })
  uploadRoomImages(
    @Param('roomId') roomId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.roomsService.uploadImages(roomId, files, req.user);
  }

  @Delete(':roomId/images/:imageIndex')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Eliminar una imagen específica de la sala' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiParam({
    name: 'imageIndex',
    description: 'Índice de la imagen (0-based)',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen eliminada correctamente',
    type: Room,
  })
  deleteRoomImage(
    @Param('roomId') roomId: string,
    // 🔥 2. APLICAR ParseIntPipe para asegurar que el índice sea un número.
    @Param('imageIndex', ParseIntPipe) imageIndex: number,
    @Request() req,
  ) {
    // Ya no es necesario convertirlo manualmente.
    return this.roomsService.deleteImage(roomId, imageIndex, req.user);
  }

  @Patch(':roomId/images/order')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Reordenar las imágenes de la sala' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiBody({
    description: 'Nuevo orden de las URLs de imágenes',
    type: UpdateImageOrderDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Orden de imágenes actualizado correctamente',
    type: Room,
  })
  updateImageOrder(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateImageOrderDto,
    @Request() req,
  ) {
    return this.roomsService.updateImageOrder(roomId, dto.imageUrls, req.user);
  }
}
