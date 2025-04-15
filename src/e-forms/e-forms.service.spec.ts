import { Test, TestingModule } from '@nestjs/testing';
import { EDocumentService } from './e-forms.service';

describe('EDocumentsService', () => {
  let service: EDocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EDocumentService],
    }).compile();

    service = module.get<EDocumentService>(EDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
