import { Test, TestingModule } from '@nestjs/testing';
import { QuickNotessService } from './quick-notes.service';

describe('QuickNotessService', () => {
  let service: QuickNotessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuickNotessService],
    }).compile();

    service = module.get<QuickNotessService>(QuickNotessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
