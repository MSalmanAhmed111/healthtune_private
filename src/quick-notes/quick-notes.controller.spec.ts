import { Test, TestingModule } from '@nestjs/testing';
import { QuickNotessController } from './quick-notes.controller';
import { QuickNotessService } from './quick-notes.service';

describe('QuickNotessController', () => {
  let controller: QuickNotessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickNotessController],
      providers: [QuickNotessService],
    }).compile();

    controller = module.get<QuickNotessController>(QuickNotessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
