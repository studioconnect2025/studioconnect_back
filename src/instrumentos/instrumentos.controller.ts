import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrumento.dto';
import { InstrumentosService } from './instrumentos.service';

@Controller('studios/me/instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentosService) {}

  @Post()
  create(@Body() dto: CreateInstrumentDto, @Req() req) {
    return this.instrumentsService.createForStudio(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.instrumentsService.findAllForStudio(req.user.id);
  }
}
