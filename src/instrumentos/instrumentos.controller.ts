import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  // Put,
  Param,
  UseGuards,
  // ParseUUIDPipe,
  // Delete,
} from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InstrumentosService } from './instrumentos.service';
// import { UpdateInstrumentoDto } from './dto/update-instrumento.dto';
import { Instruments } from './entities/instrumento.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('instruments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentosService) {}

  @Get()
  async findAllInstruments(@Req() req) {
    return this.instrumentsService.findAllForStudio(req.user.id);
  }

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<Instruments> {
    return this.instrumentsService.findInstrumentByName(name);
  }

  @Post('/create')
  @Roles(UserRole.STUDIO_OWNER)
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
