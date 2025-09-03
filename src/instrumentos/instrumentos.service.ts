import { Injectable } from '@nestjs/common';
import { CreateInstrumentoDto } from './dto/create-instrumento.dto';
import { UpdateInstrumentoDto } from './dto/update-instrumento.dto';

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

  update(id: number, updateInstrumentoDto: UpdateInstrumentoDto) {
    return `This action updates a #${id} instrumento`;
  }

  remove(id: number) {
    return `This action removes a #${id} instrumento`;
  }
}
