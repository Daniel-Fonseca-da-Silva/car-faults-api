import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';

describe('KnownIssuesRepository', () => {
  let knownIssuesRepository: KnownIssuesRepository;
  let repository: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnownIssuesRepository,
        {
          provide: getRepositoryToken(KnownIssue),
          useValue: repository,
        },
      ],
    }).compile();

    knownIssuesRepository = module.get(KnownIssuesRepository);
  });

  it('should be defined', () => {
    expect(knownIssuesRepository).toBeDefined();
  });

  describe('findByVehicleModelId', () => {
    it('delegates to repository.find with fixes relation', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      repository.find.mockResolvedValue(knownIssues);

      const result = await knownIssuesRepository.findByVehicleModelId('vm-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { vehicleModelId: 'vm-1' },
        relations: { fixes: true },
      });
      expect(result).toBe(knownIssues);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      repository.findOne.mockResolvedValue(knownIssue);

      const result = await knownIssuesRepository.findById('ki-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'ki-1' },
      });
      expect(result).toBe(knownIssue);
    });

    it('returns null when the known issue does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await knownIssuesRepository.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('saveMany', () => {
    it('saves through the given manager', async () => {
      const data = [{ title: 'Gearbox' }];
      const saved = [{ id: 'ki-1', ...data[0] }] as KnownIssue[];
      const managerRepository = { save: jest.fn().mockResolvedValue(saved) };
      const getRepository = jest.fn().mockReturnValue(managerRepository);
      const manager = { getRepository } as unknown as EntityManager;

      const result = await knownIssuesRepository.saveMany(data, manager);

      expect(getRepository).toHaveBeenCalledWith(KnownIssue);
      expect(managerRepository.save).toHaveBeenCalledWith(data);
      expect(result).toBe(saved);
    });
  });
});
