import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enum/roles.enum';
import { AdminService } from './admin.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateStudioStatusDto } from './dto/update-studio-status';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Endpoints de Usuarios ---

  @Get('users')
  @ApiOperation({ summary: 'Obtener todos los usuarios (Admin)' })
  getAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('users/active')
  @ApiOperation({ summary: 'Obtener todos los usuarios activos (Admin)' })
  getAllActiveUsers() {
    return this.adminService.findAllActiveUsers();
  }

  @Get('musicians')
  @ApiOperation({ summary: 'Obtener todos los músicos (Admin)' })
  getAllMusicians() {
    return this.adminService.findAllMusicians();
  }

  @Get('studio-owners')
  @ApiOperation({ summary: 'Obtener todos los dueños de estudio (Admin)' })
  getAllStudioOwners() {
    return this.adminService.findAllStudioOwners();
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activar o desactivar un usuario (Admin)' })
  @ApiResponse({ status: 200, description: 'Estado del usuario cambiado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  toggleUserStatus(@Param('id') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  // --- Endpoints de Estudios ---

  @Get('studios/active')
  @ApiOperation({ summary: 'Obtener todos los estudios activos (Admin)' })
  getAllActiveStudios() {
    return this.adminService.findAllActiveStudios();
  }

  @Get('studios/pending')
  @ApiOperation({ summary: 'Obtener solicitudes de estudio pendientes (Admin)' })
  getPendingStudioRequests() {
    return this.adminService.findPendingStudioRequests();
  }

  @Patch('studios/:id/process')
  @ApiOperation({
    summary: 'Aprobar o rechazar una solicitud de estudio (Admin)',
  })
  @HttpCode(HttpStatus.OK)
  processStudioRequest(
    @Param('id', ParseUUIDPipe) studioId: string, // Usar ParseUUIDPipe para validar el ID
    @Body() updateStudioStatusDto: UpdateStudioStatusDto,
  ) {
    // ✅ Pasar el DTO completo al servicio
    return this.adminService.processStudioRequest(studioId, updateStudioStatusDto);
  }

  // --- Endpoints de Reservas ---

  @Get('bookings')
  @ApiOperation({ summary: 'Obtener todas las reservas (Admin)' })
  getAllBookings() {
    return this.adminService.findAllBookings();
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Obtener todas las reseñas (Admin)' })
  getAllReviews() {
    return this.adminService.findAllReviews();
  }
}

