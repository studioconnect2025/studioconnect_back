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
} from '@nestjs/common';
import { StudiosService } from 'src/studios/studios.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { UpdateStudioDto } from 'src/studios/dto/update-studio.dto';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/rooms/dto/update-room.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Listar todas las salas de mi estudio' })
  @ApiResponse({
    status: 200,
    description: 'Listado de salas',
    schema: {
      example: [
        { id: 'room1', name: 'Sala A', capacity: 5, price: 300 },
        { id: 'room2', name: 'Sala B', capacity: 10, price: 600 },
      ],
    },
  })
  async getMyRooms(@Request() req) {
    const user = req.user;
    const studios = await this.studiosService.findMyStudios(user);
    if (!studios[0]) {
      return [];
    }
    return this.roomsService.findRoomsByStudio(studios[0].id);
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
}
