import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { StudiosService } from 'src/studios/studios.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { CreateStudioDto } from 'src/studios/dto/create-studio.dto';
import { UpdateStudioDto } from 'src/studios/dto/update-studio.dto';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/rooms/dto/update-room.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { UserRole } from 'src/auth/enum/roles.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';

@ApiTags('Owners')
@ApiBearerAuth()
@Controller('owners/me/studio')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OwnersController {
  constructor(
    private readonly studiosService: StudiosService,
    private readonly roomsService: RoomsService,
  ) {}

  // GET /owners/me/studio
  @Get()
  @ApiOperation({ summary: 'Obtener mi estudio con sus salas' })
  @ApiResponse({
    status: 200,
    description: 'Datos del estudio',
    schema: {
      example: {
        id: 'studio123',
        name: 'Prueba estudio',
        studioType: 'grabacion',
        city: 'Guadalajara',
        province: 'Jalisco',
        address: 'Calle Nueva 456',
        phoneNumber: '+52 3312345678',
        email: 'nuevo@estudio.com',
        description: 'Nueva descripción del estudio',
        photos: ['https://res.cloudinary.com/.../foto1.jpg'],
        rooms: [
          { id: 'room1', name: 'Sala A', capacity: 5, price: 300 },
          { id: 'room2', name: 'Sala B', capacity: 10, price: 600 },
        ],
      },
    },
  })
  async getMyStudio(@Request() req) {
    const user = req.user;
    const studios = await this.studiosService.findMyStudios(user);
    return studios[0] ?? {};
  }

  // PUT /owners/me/studio/files
  @Put('files')
  @ApiOperation({
    summary: 'Actualizar mi estudio con fotos y registro comercial',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del estudio con archivos',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        studioType: { type: 'string' },
        city: { type: 'string' },
        province: { type: 'string' },
        address: { type: 'string' },
        description: { type: 'string' },
        services: { type: 'array', items: { type: 'string' } },
        openingTime: { type: 'number' },
        closingTime: { type: 'number' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
        comercialRegister: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photos', maxCount: 5 },
      { name: 'comercialRegister', maxCount: 1 },
    ]),
  )
  @Roles(UserRole.STUDIO_OWNER)
  async updateMyStudioWithFiles(
    @Request() req,
    @Body() dto: UpdateStudioDto,
    @UploadedFiles()
    files: {
      photos?: Express.Multer.File[];
      comercialRegister?: Express.Multer.File[];
    },
  ) {
    const user = req.user;
    const studios = await this.studiosService.findMyStudios(user);
    if (!studios[0]) {
      return { message: 'No tienes estudios creados aún' };
    }
    return this.studiosService.updateMyStudioWithFiles(
      user,
      studios[0].id,
      dto,
      files,
    );
  }

  // PUT /owners/me/studio
  @Put()
  @ApiOperation({ summary: 'Actualizar los datos de mi estudio' })
  @ApiResponse({ status: 200, description: 'Estudio actualizado' })
  async updateMyStudio(@Request() req, @Body() dto: UpdateStudioDto) {
    const user = req.user;
    const studios = await this.studiosService.findMyStudios(user);
    if (!studios[0]) {
      return { message: 'No tienes estudios creados aún' };
    }
    return this.studiosService.updateMyStudio(user, studios[0].id, dto);
  }

  // GET /owners/me/studio/rooms
  @Get('rooms')
  @ApiOperation({
    summary: 'Listar todas las salas de mi estudio con imágenes',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async getMyRooms(@Request() req) {
    const user = req.user;
    const rooms = await this.roomsService.findRoomsByUser(user);

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      size: room.size,
      pricePerHour: room.pricePerHour,
      minHours: room.minHours,
      description: room.description,
      features: room.features,
      customEquipment: room.customEquipment,
      availability: room.availability,
      imageUrls: room.imageUrls || [],
      isActive: room.isActive,
    }));
  }

  // POST /owners/me/studio/rooms
  @Post('rooms')
  @ApiOperation({ summary: 'Crear una nueva sala en mi estudio' })
  @ApiResponse({ status: 201, description: 'Sala creada' })
  async createRoom(@Request() req, @Body() dto: CreateRoomDto) {
    const user = req.user;
    const studios = await this.studiosService.findMyStudios(user);
    if (!studios[0]) {
      return { message: 'No tienes estudios creados aún' };
    }
    return this.roomsService.create(dto, user, studios[0].id);
  }

  // PUT /owners/me/studio/rooms/:roomId
  @Put('rooms/:roomId')
  @ApiOperation({ summary: 'Editar una sala existente' })
  @ApiParam({ name: 'roomId', type: String })
  @ApiResponse({ status: 200, description: 'Sala actualizada' })
  async updateRoom(
    @Request() req,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    const user = req.user;
    return this.roomsService.update(roomId, dto, user);
  }

  // DELETE /owners/me/studio/rooms/:roomId
  @Delete('rooms/:roomId')
  @ApiOperation({ summary: 'Eliminar una sala' })
  @ApiParam({ name: 'roomId', type: String })
  @ApiResponse({ status: 200, description: 'Sala eliminada' })
  async deleteRoom(@Request() req, @Param('roomId') roomId: string) {
    const user = req.user;
    await this.roomsService.remove(roomId, user);
    return { message: 'Sala eliminada con éxito' };
  }

  // POST /owners/me/studio/files
  @Post('files')
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
        studioType: { type: 'string' },
        city: { type: 'string' },
        province: { type: 'string' },
        address: { type: 'string' },
        description: { type: 'string' },
        services: { type: 'array', items: { type: 'string' } },
        openingTime: { type: 'number' },
        closingTime: { type: 'number' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
        comercialRegister: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photos', maxCount: 5 },
      { name: 'comercialRegister', maxCount: 1 },
    ]),
  )
  @Roles(UserRole.STUDIO_OWNER)
  async createMyStudioWithFiles(
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
}
