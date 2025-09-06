import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Put,
  Param,
  // ParseUUIDPipe,
  // Delete,
} from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InstrumentosService } from './instrumentos.service';
import { UpdateInstrumentoDto } from './dto/update-instrumento.dto';
import { Instruments } from './entities/instrumento.entity';

@Controller('instruments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentosService) {}

  @Get()
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Obtener todos los instrumentos del estudio del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de instrumentos obtenida con éxito.' })
  async findAllInstruments(@Req() req) {
    return this.instrumentsService.findAllForStudio(req.user.id);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Obtener un instrumento por su nombre' })
  @ApiResponse({ status: 200, description: 'Instrumento encontrado.' })
  @ApiResponse({ status: 404, description: 'Instrumento no encontrado.' })
  async findOne(@Param('name') name: string): Promise<Instruments> {
    return this.instrumentsService.findInstrumentByName(name);
  }

  @Post('/create')
  async createInstrument(@Body() dto: CreateInstrumentDto, @Req() req: any) {
    return await this.instrumentsService.createForStudio(req.user.id, dto);
  }

  @Put(':id')
  @Roles(UserRole.STUDIO_OWNER)
  @ApiOperation({ summary: 'Actualizar un instrumento existente' })
  @ApiResponse({ status: 200, description: 'Instrumento actualizado con éxito.' })
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
  async deleteInstrument(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
     // Es necesario implementar el método `deleteInstrument` en el servicio
     // y asegurarse de que el usuario (req.user) tiene permiso para eliminar este instrumento.
    // return await this.instrumentosService.deleteInstrument(id, req.user);
  }
}
