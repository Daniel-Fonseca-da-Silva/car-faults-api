import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';
import { KnownIssuesService } from './known-issues.service';

describe('KnownIssuesService', () => {
  let knownIssuesService: KnownIssuesService;
  let knownIssuesRepository: {
    findByVehicleModelId: jest.Mock;
    saveMany: jest.Mock;
  };

  beforeEach(async () => {
    knownIssuesRepository = {
      findByVehicleModelId: jest.fn(),
      saveMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnownIssuesService,
        {
          provide: KnownIssuesRepository,
          useValue: knownIssuesRepository,
        },
      ],
    }).compile();

    knownIssuesService = module.get(KnownIssuesService);
  });

  it('should be defined', () => {
    expect(knownIssuesService).toBeDefined();
  });

  describe('findByVehicleModelId', () => {
    it('delegates to the repository', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      knownIssuesRepository.findByVehicleModelId.mockResolvedValue(knownIssues);

      const result = await knownIssuesService.findByVehicleModelId('vm-1');

      expect(knownIssuesRepository.findByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(result).toBe(knownIssues);
    });
  });

  describe('saveMany', () => {
    it('delegates to the repository', async () => {
      const data = [{ title: 'Gearbox' }];
      const saved = [{ id: 'ki-1', ...data[0] }] as KnownIssue[];
      const manager = {} as EntityManager;
      knownIssuesRepository.saveMany.mockResolvedValue(saved);

      const result = await knownIssuesService.saveMany(data, manager);

      expect(knownIssuesRepository.saveMany).toHaveBeenCalledWith(
        data,
        manager,
      );
      expect(result).toBe(saved);
    });
  });
});
