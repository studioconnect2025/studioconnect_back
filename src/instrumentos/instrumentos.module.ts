import { Module } from '@nestjs/common';
import { InstrumentosService } from './instrumentos.service';
import { InstrumentsController } from './instrumentos.controller';

@Module({
  controllers: [InstrumentsController],
  providers: [InstrumentosService],
})
export class InstrumentosModule {}
