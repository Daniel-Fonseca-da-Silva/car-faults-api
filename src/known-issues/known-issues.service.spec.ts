import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { KnownIssue } from './entities/known-issue.entity';
import { IssueSeverity } from './enums/issue-severity.enum';
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
    findByIdWithFixes: jest.Mock;
    saveMany: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    countAll: jest.Mock;
    findTopByCommentCount: jest.Mock;
  };
  let vehicleModelsService: { findById: jest.Mock };
  let cache: { del: jest.Mock };

  const vehicleModel = {
    id: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    yearFrom: 2001,
    yearTo: 2001,
    engine: '1.0',
    doors: null,
    fuelType: null,
  };

  beforeEach(async () => {
    knownIssuesRepository = {
      findByVehicleModelId: jest.fn(),
      findByVehicleModelIdAndLocale: jest.fn(),
      countByVehicleModelId: jest.fn(),
      countByVehicleModelIdAndLocale: jest.fn(),
      findById: jest.fn(),
      findByIdWithFixes: jest.fn(),
      saveMany: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      countAll: jest.fn(),
      findTopByCommentCount: jest.fn(),
    };
    vehicleModelsService = { findById: jest.fn() };
    cache = { del: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnownIssuesService,
        {
          provide: KnownIssuesRepository,
          useValue: knownIssuesRepository,
        },
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: CACHE_MANAGER, useValue: cache },
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

  describe('findByIdWithFixes', () => {
    it('delegates to the repository', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      knownIssuesRepository.findByIdWithFixes.mockResolvedValue(knownIssue);

      const result = await knownIssuesService.findByIdWithFixes('ki-1');

      expect(knownIssuesRepository.findByIdWithFixes).toHaveBeenCalledWith(
        'ki-1',
      );
      expect(result).toBe(knownIssue);
    });
  });

  describe('create', () => {
    const data = {
      vehicleModelId: 'vm-1',
      title: 'Gearbox',
      description: 'Wears out',
      severity: IssueSeverity.HIGH,
    };

    it('creates the known issue and evicts the lookup cache', async () => {
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      const created = { ...data, aiGeneratedAt: null } as KnownIssue;
      const saved = { ...created, id: 'ki-1' };
      knownIssuesRepository.create.mockReturnValue(created);
      knownIssuesRepository.save.mockResolvedValue(saved);

      const result = await knownIssuesService.create(data);

      expect(knownIssuesRepository.create).toHaveBeenCalledWith({
        ...data,
        aiGeneratedAt: null,
      });
      expect(cache.del).toHaveBeenCalled();
      expect(result).toBe(saved);
    });

    it('throws NotFoundException when the vehicle model does not exist', async () => {
      vehicleModelsService.findById.mockResolvedValue(null);

      await expect(knownIssuesService.create(data)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the known issue and evicts the lookup cache', async () => {
      const existing = { id: 'ki-1', vehicleModelId: 'vm-1' } as KnownIssue;
      knownIssuesRepository.findById.mockResolvedValue(existing);
      knownIssuesRepository.save.mockImplementation((entity: KnownIssue) =>
        Promise.resolve(entity),
      );
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);

      const result = await knownIssuesService.update('ki-1', {
        title: 'New title',
      });

      expect(result.title).toBe('New title');
      expect(cache.del).toHaveBeenCalled();
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesRepository.findById.mockResolvedValue(null);

      await expect(
        knownIssuesService.update('missing', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('soft deletes the known issue and evicts the lookup cache', async () => {
      const existing = { id: 'ki-1', vehicleModelId: 'vm-1' } as KnownIssue;
      knownIssuesRepository.findById.mockResolvedValue(existing);
      knownIssuesRepository.softDelete.mockResolvedValue(undefined);
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);

      await knownIssuesService.softDelete('ki-1');

      expect(knownIssuesRepository.softDelete).toHaveBeenCalledWith('ki-1');
      expect(cache.del).toHaveBeenCalled();
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesRepository.findById.mockResolvedValue(null);

      await expect(knownIssuesService.softDelete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countAll', () => {
    it('delegates to the repository', async () => {
      knownIssuesRepository.countAll.mockResolvedValue(5);

      const result = await knownIssuesService.countAll();

      expect(knownIssuesRepository.countAll).toHaveBeenCalledWith();
      expect(result).toBe(5);
    });
  });

  describe('findTopByCommentCount', () => {
    it('delegates to the repository', async () => {
      const knownIssues = [
        { id: 'ki-1', commentCount: 5 },
      ] as unknown as KnownIssue[];
      knownIssuesRepository.findTopByCommentCount.mockResolvedValue(
        knownIssues,
      );

      const result = await knownIssuesService.findTopByCommentCount(
        LookupLocale.EnGb,
        6,
      );

      expect(knownIssuesRepository.findTopByCommentCount).toHaveBeenCalledWith(
        LookupLocale.EnGb,
        6,
      );
      expect(result).toBe(knownIssues);
    });
  });
});
