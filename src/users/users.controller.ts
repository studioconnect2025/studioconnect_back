import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserById(@Param('id') id: string): Promise<User> {
    return await this.usersService.findOneById(id);
  }

  @Get('by-email')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Obtener usuario por email' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserByEmail(@Query('email') email: string): Promise<User> {
    return await this.usersService.findOneByEmail(email);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Eliminar o desactivar usuario según rol y reservas',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado o desactivado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar usuario con reservas activas',
  })
  async deleteUser(@Param('id') id: string) {
    const result = await this.usersService.softDeleteUser(id);
    return { message: result };
  }

  @Patch('studio/toggle-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Activar o desactivar el estudio del dueño logueado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estudio activado o desactivado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Estudio no encontrado' })
  async toggleStudio(@Req() req: Request & { user: { id: string } }) {
    const ownerId = req.user.id;
    const message = await this.usersService.toggleOwnStudioStatus(ownerId);
    return { message };
  }
}
