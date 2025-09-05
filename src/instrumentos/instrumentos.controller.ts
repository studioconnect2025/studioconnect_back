import {
 Controller,
  Post,
  Get,
  Body,
  Req,
  // Put,
  Param,
  // ParseUUIDPipe,
  // Delete,
} from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InstrumentosService } from './instrumentos.service';
// import { UpdateInstrumentoDto } from './dto/update-instrumento.dto';
import { Instruments } from './entities/instrumento.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Instruments') // Grupo en Swagger
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los instrumentos del estudio del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de instrumentos obtenida con éxito.' })
  async findAllInstruments(@Req() req) {
    return this.instrumentsService.findAllForStudio(req.user.id);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Obtener un instrumento por su nombre' })
  @ApiResponse({ status: 200, description: 'Instrumento encontrado correctamente.', type: Instruments })
  @ApiResponse({ status: 404, description: 'Instrumento no encontrado.' })
  async findOne(@Param('name') name: string): Promise<Instruments> {
    return this.instrumentsService.findInstrumentById(name);
  }

  @Post('/create')
  @ApiOperation({ summary: 'Crear un nuevo instrumento asociado a un estudio' })
  @ApiResponse({ status: 201, description: 'Instrumento creado con éxito.', type: Instruments })
  @ApiResponse({ status: 400, description: 'Datos inválidos para la creación del instrumento.' })
  async createInstrument(@Body() dto: CreateInstrumentDto, @Req() req: any) {
    return await this.instrumentsService.createForStudio(req.user.id, dto);
  }

    // @Put(':id')
  // async updateProduct(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateInstrumentDto: UpdateInstrumentoDto,
  // ) {
  //   return await this.productsService.updateProduct(id, updateInstrumentDto);
  // }

  // @Delete(':id')
  // async deleteInstrument(@Param('id', ParseUUIDPipe) id: string) {
  //   return await this.instrumentsService.deleteInstrument(id);
  // }
}

// Hay un error en esta linea de codigo
// @Get()
//   @ApiOperation({ summary: 'Obtener todos los instrumentos del estudio del usuario autenticado' })
//   @ApiResponse({ status: 200, description: 'Lista de instrumentos obtenida con éxito.' })
//   async findAllInstruments(@Req() req) {
//     return this.instrumentsService.findAllForStudio(req.user.id);
//   }
// dice que se esperan 0 argumentos y recibe uno (checar)