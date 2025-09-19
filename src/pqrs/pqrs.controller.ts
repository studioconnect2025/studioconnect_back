import { Controller, Post, Body, UseGuards, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PqrsService } from './pqrs.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enum/roles.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';
import { CreatePqrResponseDto } from './dto/create-pqr-response.dto';

@ApiTags('PQRs')
@Controller('pqrs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Post()
  @Roles(UserRole.MUSICIAN, UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Crear una nueva PQR (queja, reclamo o sugerencia)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'La PQR fue creada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Forbidden).' })
  // -> EJEMPLO DE JSON PARA SWAGGER
  @ApiBody({
    type: CreatePqrDto,
    examples: {
      queja: {
        summary: 'Ejemplo de una Queja',
        value: {
          subject: 'El micrófono de la sala A no funciona',
          description: 'Durante mi sesión, el micrófono condensador presentaba mucho ruido estático.',
          type: 'QUEJA',
          reportedUserId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      reclamo: {
        summary: 'Ejemplo de un Reclamo sin usuario reportado',
        value: {
          subject: 'Cobro incorrecto en mi última reserva',
          description: 'Se me cobró por un instrumento que no utilicé.',
          type: 'RECLAMO',
        },
      },
    },
  })
  create(@Body() createPqrDto: CreatePqrDto, @GetUser() user: User) {
    return this.pqrsService.create(createPqrDto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todas las PQRs (Solo para Admins)' })
  @ApiBearerAuth('JWT-auth')
  findAll() {
    return this.pqrsService.findAll();
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar el estado de una PQR (Solo para Admins)' })
  @ApiBearerAuth('JWT-auth')
  // -> EJEMPLO DE JSON PARA SWAGGER
  @ApiBody({
    type: UpdatePqrStatusDto,
    examples: {
      enProgreso: {
        summary: 'Marcar como En Progreso',
        value: { status: 'EN_PROGRESO' },
      },
      resuelto: {
        summary: 'Marcar como Resuelto',
        value: { status: 'RESUELTO' },
      },
    },
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePqrStatusDto: UpdatePqrStatusDto,
  ) {
    return this.pqrsService.updateStatus(id, updatePqrStatusDto.status);
  }

  @Post(':id/responses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Añadir una respuesta a una PQR (Solo para Admins)' })
  @ApiBearerAuth('JWT-auth')
  // --- INICIO DE LA CORRECCIÓN ---
  @ApiBody({
    type: CreatePqrResponseDto,
    examples: { // 1. Cambiado de 'example' a 'examples'
      respuesta: { // 2. Se le da un nombre al ejemplo
        summary: 'Ejemplo de respuesta',
        value: { // 3. El valor del ejemplo va dentro de 'value'
          content: 'Hola, hemos revisado el equipo y realizado el mantenimiento correspondiente. Lamentamos los inconvenientes.',
        },
      },
    },
  })
  // --- FIN DE LA CORRECCIÓN ---
  addResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createPqrResponseDto: CreatePqrResponseDto,
    @GetUser() admin: User,
  ) {
    return this.pqrsService.addResponse(id, createPqrResponseDto, admin);
  }
}