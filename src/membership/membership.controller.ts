import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MembershipsService } from './membership.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';

@ApiTags('Memberships')
@ApiBearerAuth('JWT-auth')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // --- RUTA PARA DUEÑOS DE ESTUDIO ---
  @ApiOperation({
    summary: 'Solicitar compra de membresía (pendiente de pago)',
  })
  @ApiResponse({
    status: 201,
    description: 'Membresía registrada como INACTIVE',
  })
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async createMembership(
    @Body() dto: CreateMembershipDto,
    @Request() req: { user: User },
  ) {
    return this.membershipsService.create(dto, req.user);
  }

  @ApiOperation({
    summary: 'Obtener la membresía activa de mi estudio (dueño)',
  })
  @Get('owner/my-active-membership')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  async getMyActiveMembership(@Request() req: { user: User }) {
    if (!req.user.studio) {
      throw new NotFoundException('El usuario no tiene estudio asociado');
    }
    return this.membershipsService.getActiveMembership(req.user.studio.id);
  }

  // --- RUTA PARA ADMINS ---
  @ApiOperation({
    summary: 'Obtener la membresía activa de un estudio (solo admin)',
  })
  @ApiParam({ name: 'studioId', type: String })
  @Get('admin/:studioId/active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async getActiveMembershipByStudio(@Param('studioId') studioId: string) {
    return this.membershipsService.getActiveMembership(studioId);
  }
}
