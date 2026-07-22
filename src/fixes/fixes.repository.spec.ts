import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { Fix } from './entities/fix.entity';
import { FixesRepository } from './fixes.repository';

describe('FixesRepository', () => {
  let fixesRepository: FixesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixesRepository],
    }).compile();

    fixesRepository = module.get(FixesRepository);
  });

  it('should be defined', () => {
    expect(fixesRepository).toBeDefined();
  });

  describe('saveMany', () => {
    it('saves through the given manager', async () => {
      const data = [{ summary: 'Replace synchros' }];
      const saved = [{ id: 'fix-1', ...data[0] }] as Fix[];
      const managerRepository = { save: jest.fn().mockResolvedValue(saved) };
      const getRepository = jest.fn().mockReturnValue(managerRepository);
      const manager = { getRepository } as unknown as EntityManager;

      const result = await fixesRepository.saveMany(data, manager);

      expect(getRepository).toHaveBeenCalledWith(Fix);
      expect(managerRepository.save).toHaveBeenCalledWith(data);
      expect(result).toBe(saved);
    });
  });
});
