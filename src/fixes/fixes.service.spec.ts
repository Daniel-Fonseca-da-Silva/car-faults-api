import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { Fix } from './entities/fix.entity';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

describe('FixesService', () => {
  let fixesService: FixesService;
  let fixesRepository: { saveMany: jest.Mock };

  beforeEach(async () => {
    fixesRepository = {
      saveMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixesService,
        {
          provide: FixesRepository,
          useValue: fixesRepository,
        },
      ],
    }).compile();

    fixesService = module.get(FixesService);
  });

  it('should be defined', () => {
    expect(fixesService).toBeDefined();
  });

  describe('saveMany', () => {
    it('delegates to the repository', async () => {
      const data = [{ summary: 'Replace synchros' }];
      const saved = [{ id: 'fix-1', ...data[0] }] as Fix[];
      const manager = {} as EntityManager;
      fixesRepository.saveMany.mockResolvedValue(saved);

      const result = await fixesService.saveMany(data, manager);

      expect(fixesRepository.saveMany).toHaveBeenCalledWith(data, manager);
      expect(result).toBe(saved);
    });
  });
});
