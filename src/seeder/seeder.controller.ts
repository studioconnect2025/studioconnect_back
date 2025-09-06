import { Controller, Post, UseGuards } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('seeder')
@Controller('seeder')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Carga los datos iniciales en la base de datos' })
  @ApiResponse({
    status: 201,
    description: 'Datos precargados correctamente.',
  })
  seed() {
    return this.seederService.seed();
  }

  @Post('reset')
  @ApiOperation({
    summary:
      'Resetea los datos de las tablas (solo funciona si no hay reservas)',
  })
  @ApiResponse({
    status: 201,
    description: 'Datos reseteados correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede resetear porque existen reservas.',
  })
  resetData() {
    return this.seederService.resetData();
  }
}
