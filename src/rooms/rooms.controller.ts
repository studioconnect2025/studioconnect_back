import { Controller, Post, Patch, Delete, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Room } from './entities/room.entity';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post(':studioId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Crear una sala en un estudio' })
  @ApiParam({ name: 'studioId', description: 'ID del estudio' })
  @ApiResponse({ status: 201, description: 'Sala creada correctamente', type: Room })
  createRoom(
    @Param('studioId') studioId: string,
    @Body() dto: CreateRoomDto,
    @Request() req,
  ) {
    return this.roomsService.create(dto, req.user, studioId);
  }

  @Patch(':roomId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar una sala existente' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @ApiResponse({ status: 200, description: 'Sala actualizada correctamente', type: Room })
  updateRoom(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
    @Request() req,
  ) {
    return this.roomsService.update(roomId, dto, req.user);
  }

  @Delete(':roomId')
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
}
