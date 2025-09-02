import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentosController } from './instrumentos.controller';
import { InstrumentosService } from './instrumentos.service';

describe('InstrumentosController', () => {
  let controller: InstrumentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstrumentosController],
      providers: [InstrumentosService],
    }).compile();

    controller = module.get<InstrumentosController>(InstrumentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
