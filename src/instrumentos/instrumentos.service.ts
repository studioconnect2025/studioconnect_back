import { Injectable } from '@nestjs/common';
import { CreateInstrumentoDto } from './dto/create-instrumento.dto';

@Injectable()
export class InstrumentosService {
  create(createInstrumentoDto: CreateInstrumentoDto) {
    return 'This action adds a new instrumento';
  }

  findAll() {
    return `This action returns all instrumentos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} instrumento`;
  }

}
