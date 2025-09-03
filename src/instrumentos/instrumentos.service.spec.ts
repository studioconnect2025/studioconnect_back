import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentosService } from './instrumentos.service';

describe('InstrumentosService', () => {
  let service: InstrumentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstrumentosService],
    }).compile();

    service = module.get<InstrumentosService>(InstrumentosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
