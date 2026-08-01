import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';
import { KnownIssuesService } from './known-issues.service';

describe('KnownIssuesService', () => {
  let knownIssuesService: KnownIssuesService;
  let knownIssuesRepository: {
    findByVehicleModelId: jest.Mock;
    findByVehicleModelIdAndLocale: jest.Mock;
    countByVehicleModelId: jest.Mock;
    countByVehicleModelIdAndLocale: jest.Mock;
    findById: jest.Mock;
    saveMany: jest.Mock;
  };

  beforeEach(async () => {
    knownIssuesRepository = {
      findByVehicleModelId: jest.fn(),
      findByVehicleModelIdAndLocale: jest.fn(),
      countByVehicleModelId: jest.fn(),
      countByVehicleModelIdAndLocale: jest.fn(),
      findById: jest.fn(),
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

  describe('findByVehicleModelIdAndLocale', () => {
    it('delegates to the repository', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      knownIssuesRepository.findByVehicleModelIdAndLocale.mockResolvedValue(
        knownIssues,
      );

      const result = await knownIssuesService.findByVehicleModelIdAndLocale(
        'vm-1',
        LookupLocale.PtPt,
      );

      expect(
        knownIssuesRepository.findByVehicleModelIdAndLocale,
      ).toHaveBeenCalledWith('vm-1', LookupLocale.PtPt);
      expect(result).toBe(knownIssues);
    });
  });

  describe('countByVehicleModelId', () => {
    it('delegates to the repository', async () => {
      knownIssuesRepository.countByVehicleModelId.mockResolvedValue(3);

      const result = await knownIssuesService.countByVehicleModelId('vm-1');

      expect(knownIssuesRepository.countByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(result).toBe(3);
    });
  });

  describe('countByVehicleModelIdAndLocale', () => {
    it('delegates to the repository', async () => {
      knownIssuesRepository.countByVehicleModelIdAndLocale.mockResolvedValue(2);

      const result = await knownIssuesService.countByVehicleModelIdAndLocale(
        'vm-1',
        LookupLocale.PtPt,
      );

      expect(
        knownIssuesRepository.countByVehicleModelIdAndLocale,
      ).toHaveBeenCalledWith('vm-1', LookupLocale.PtPt);
      expect(result).toBe(2);
    });
  });

  describe('findById', () => {
    it('delegates to the repository', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      knownIssuesRepository.findById.mockResolvedValue(knownIssue);

      const result = await knownIssuesService.findById('ki-1');

      expect(knownIssuesRepository.findById).toHaveBeenCalledWith('ki-1');
      expect(result).toBe(knownIssue);
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
