import { Controller, Get, UseGuards, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enum/roles.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateStudioStatusDto } from './dto/update-studio-status';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplicamos los guards a todo el controlador
@Roles(UserRole.ADMIN) // Definimos el rol para todo el controlador
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Endpoints de Usuarios ---
  @Get('users')
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  getAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('users/active')
  @ApiOperation({ summary: 'Obtener todos los usuarios activos' })
  getAllActiveUsers() {
    return this.adminService.findAllActiveUsers();
  }

  @Get('musicians')
  @ApiOperation({ summary: 'Obtener todos los Músicos' })
  getAllMusicians() {
    return this.adminService.findAllMusicians();
  }

  @Get('studio-owners')
  @ApiOperation({ summary: 'Obtener todos los Dueños de Estudio' })
  getAllStudioOwners() {
    return this.adminService.findAllStudioOwners();
  }

  // --- Endpoints de Estudios ---
  @Get('studios/active')
  @ApiOperation({ summary: 'Obtener todos los estudios activos' })
  getAllActiveStudios() {
    return this.adminService.findAllActiveStudios();
  }

  @Get('studios/pending-requests')
  @ApiOperation({ summary: 'Obtener solicitudes de estudio pendientes de aprobación' })
  getPendingStudioRequests() {
    return this.adminService.findPendingStudioRequests();
  }

  @Patch('studios/requests/:id')
  @ApiOperation({ summary: 'Aprobar o rechazar una solicitud de estudio' })
  @ApiResponse({ status: 200, description: 'Estado de la solicitud actualizado.' })
  @ApiResponse({ status: 404, description: 'Solicitud de estudio no encontrada.' })
  processStudioRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudioStatusDto: UpdateStudioStatusDto,
  ) {
    return this.adminService.processStudioRequest(id, updateStudioStatusDto);
  }
  
  // --- Endpoint de Reservas ---
  @Get('bookings')
  @ApiOperation({ summary: 'Obtener todas las reservas de la plataforma' })
  getAllBookings() {
    return this.adminService.findAllBookings();
  }
}

