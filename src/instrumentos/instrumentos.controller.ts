import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Put,
  Param,
  ParseUUIDPipe,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InstrumentosService } from './instrumentos.service';
import { UpdateInstrumentoDto } from './dto/update-instrumento.dto';
import { Instruments } from './entities/instrumento.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('instruments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentosService) {}

  @Get()
  @Roles(UserRole.STUDIO_OWNER, UserRole.MUSICIAN)
  @ApiOperation({
    summary:
      'Obtener todos los instrumentos de la sala del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instrumentos obtenida con éxito.',
  })
  async findAllInstruments(
    @Body() createInstrumentoDto: CreateInstrumentDto,
    @Req() req,
  ) {
    return this.instrumentsService.createForRoom(
      req.user.id,
      createInstrumentoDto,
    );
  }

  @Get(':name')
  @Roles(UserRole.STUDIO_OWNER, UserRole.MUSICIAN)
  @ApiOperation({ summary: 'Obtener un instrumento por su nombre' })
  @ApiResponse({ status: 200, description: 'Instrumento encontrado.' })
  @ApiResponse({ status: 404, description: 'Instrumento no encontrado.' })
  async findOne(@Param('name') name: string): Promise<Instruments> {
    return this.instrumentsService.findInstrumentById(name);
  }

  @Post('/create')
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Crear un nuevo instrumento para una sala' })
  @ApiResponse({ status: 201, description: 'Instrumento creado con éxito.' })
  async createInstrument(@Body() dto: CreateInstrumentDto, @Req() req: any) {
    return await this.instrumentsService.createForRoom(req.user.id, dto);
  }

  @Put(':id')
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar un instrumento existente' })
  @ApiResponse({
    status: 200,
    description: 'Instrumento actualizado con éxito.',
  })
  async updateInstrument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInstrumentDto: UpdateInstrumentoDto,
    @Req() req: any,
  ) {
    // Es necesario implementar el método `updateProduct` en el servicio
    // y asegurarse de que el usuario (req.user) tiene permiso para editar este instrumento.
    // Por ahora, he corregido el nombre del servicio.
    // return await this.instrumentosService.updateInstrument(id, updateInstrumentDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Eliminar un instrumento' })
  @ApiResponse({ status: 200, description: 'Instrumento eliminado con éxito.' })
  async deleteInstrument(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    // Es necesario implementar el método `deleteInstrument` en el servicio
    // y asegurarse de que el usuario (req.user) tiene permiso para eliminar este instrumento.
    // return await this.instrumentosService.deleteInstrument(id, req.user);
  }
}
