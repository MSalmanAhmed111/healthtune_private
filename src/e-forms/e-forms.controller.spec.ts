import { Test, TestingModule } from '@nestjs/testing';
import { EDocumentController } from './e-forms.controller';
import { EDocumentService } from './e-forms.service';

describe('EDocumentsController', () => {
  let controller: EDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EDocumentController],
      providers: [EDocumentService],
    }).compile();

    controller = module.get<EDocumentController>(EDocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
