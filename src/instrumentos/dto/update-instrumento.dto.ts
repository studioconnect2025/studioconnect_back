import { PartialType } from '@nestjs/mapped-types';
import { CreateInstrumentDto } from './create-instrumento.dto';

export class UpdateInstrumentoDto extends PartialType(CreateInstrumentDto) {}
