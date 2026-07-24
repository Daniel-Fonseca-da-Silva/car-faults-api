import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { EntityManager } from 'typeorm';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { Fix } from './entities/fix.entity';
import { FixVote } from './entities/fix-vote.entity';
import { FixSource } from './enums/fix-source.enum';
import { FixVoteValue } from './enums/fix-vote-value.enum';
import { FixVotesRepository } from './fix-votes.repository';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

describe('FixesService', () => {
  let fixesService: FixesService;
  let fixesRepository: {
    saveMany: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    findByKnownIssueIdWithCounts: jest.Mock;
    findByIdWithCounts: jest.Mock;
  };
  let fixVotesRepository: {
    findByFixAndUser: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let knownIssuesService: { findById: jest.Mock };
  let vehicleModelsService: { findById: jest.Mock };
  let cache: { del: jest.Mock };

  const userId = 'user-1';

  const vehicleModel = {
    id: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    yearFrom: 2001,
    yearTo: 2001,
    engine: '1.0',
    doors: null,
  };

  const buildFix = (overrides: Partial<Fix> = {}) =>
    ({
      id: 'fix-1',
      knownIssueId: 'ki-1',
      userId,
      summary: 'Replace synchros',
      steps: 'Remove gearbox and replace synchro rings.',
      estimatedCostEur: null,
      source: FixSource.USER,
      ...overrides,
    }) as Fix;

  beforeEach(async () => {
    fixesRepository = {
      saveMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByKnownIssueIdWithCounts: jest.fn(),
      findByIdWithCounts: jest.fn(),
    };
    fixVotesRepository = {
      findByFixAndUser: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    knownIssuesService = { findById: jest.fn() };
    vehicleModelsService = { findById: jest.fn() };
    cache = { del: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixesService,
        { provide: FixesRepository, useValue: fixesRepository },
        { provide: FixVotesRepository, useValue: fixVotesRepository },
        { provide: KnownIssuesService, useValue: knownIssuesService },
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    fixesService = module.get(FixesService);

    knownIssuesService.findById.mockResolvedValue({
      id: 'ki-1',
      vehicleModelId: 'vm-1',
    });
    vehicleModelsService.findById.mockResolvedValue(vehicleModel);
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

  describe('findByKnownIssue', () => {
    it('delegates to the repository', async () => {
      const fixes = [{ id: 'fix-1' }];
      fixesRepository.findByKnownIssueIdWithCounts.mockResolvedValue(fixes);

      const result = await fixesService.findByKnownIssue('ki-1', userId);

      expect(fixesRepository.findByKnownIssueIdWithCounts).toHaveBeenCalledWith(
        'ki-1',
        userId,
      );
      expect(result).toBe(fixes);
    });
  });

  describe('create', () => {
    it('creates a fix, evicts the lookup cache and returns it with counts', async () => {
      const created = buildFix();
      fixesRepository.create.mockReturnValue(created);
      fixesRepository.save.mockResolvedValue(created);
      const withCounts = { ...created, likes: 0, dislikes: 0, myVote: null };
      fixesRepository.findByIdWithCounts.mockResolvedValue(withCounts);

      const result = await fixesService.create(userId, {
        knownIssueId: 'ki-1',
        summary: 'Replace synchros',
        steps: 'Remove gearbox and replace synchro rings.',
        estimatedCostEur: 100,
      });

      expect(knownIssuesService.findById).toHaveBeenCalledWith('ki-1');
      expect(fixesRepository.create).toHaveBeenCalledWith({
        knownIssueId: 'ki-1',
        userId,
        summary: 'Replace synchros',
        steps: 'Remove gearbox and replace synchro rings.',
        estimatedCostEur: '100',
        source: FixSource.USER,
      });
      expect(cache.del).toHaveBeenCalledWith(
        'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      );
      expect(result).toBe(withCounts);
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesService.findById.mockResolvedValue(null);

      await expect(
        fixesService.create(userId, {
          knownIssueId: 'missing',
          summary: 'Replace synchros',
          steps: 'Steps',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(fixesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws BadRequestException when no fields are provided', async () => {
      await expect(fixesService.update('fix-1', userId, {})).rejects.toThrow(
        BadRequestException,
      );
      expect(fixesRepository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the fix does not exist', async () => {
      fixesRepository.findById.mockResolvedValue(null);

      await expect(
        fixesService.update('fix-1', userId, { summary: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the fix belongs to another user', async () => {
      fixesRepository.findById.mockResolvedValue(
        buildFix({ userId: 'other-user' }),
      );

      await expect(
        fixesService.update('fix-1', userId, { summary: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the fix is AI-sourced', async () => {
      fixesRepository.findById.mockResolvedValue(
        buildFix({ source: FixSource.AI }),
      );

      await expect(
        fixesService.update('fix-1', userId, { summary: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates provided fields, evicts the cache and returns counts', async () => {
      const fix = buildFix();
      fixesRepository.findById.mockResolvedValue(fix);
      fixesRepository.save.mockImplementation((f) => Promise.resolve(f));
      const withCounts = { ...fix, likes: 2, dislikes: 1, myVote: null };
      fixesRepository.findByIdWithCounts.mockResolvedValue(withCounts);

      const result = await fixesService.update('fix-1', userId, {
        summary: 'Updated summary',
        steps: 'Updated steps',
        estimatedCostEur: 250,
      });

      expect(fix.summary).toBe('Updated summary');
      expect(fix.steps).toBe('Updated steps');
      expect(fix.estimatedCostEur).toBe('250');
      expect(cache.del).toHaveBeenCalled();
      expect(result).toBe(withCounts);
    });

    it('throws NotFoundException when the updated fix cannot be reloaded with counts', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      fixesRepository.save.mockResolvedValue(buildFix());
      fixesRepository.findByIdWithCounts.mockResolvedValue(null);

      await expect(
        fixesService.update('fix-1', userId, { summary: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the fix and evicts the cache when owned by the user', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());

      await fixesService.remove('fix-1', userId);

      expect(fixesRepository.delete).toHaveBeenCalledWith('fix-1');
      expect(cache.del).toHaveBeenCalled();
    });

    it('throws NotFoundException when the fix does not exist', async () => {
      fixesRepository.findById.mockResolvedValue(null);

      await expect(fixesService.remove('fix-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(fixesRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('vote', () => {
    const otherUserId = 'author-1';

    it('throws NotFoundException when the fix does not exist', async () => {
      fixesRepository.findById.mockResolvedValue(null);

      await expect(
        fixesService.vote('fix-1', userId, FixVoteValue.LIKE),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when voting on your own fix', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix({ userId }));

      await expect(
        fixesService.vote('fix-1', userId, FixVoteValue.LIKE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a new vote when none exists', async () => {
      fixesRepository.findById.mockResolvedValue(
        buildFix({ userId: otherUserId }),
      );
      fixVotesRepository.findByFixAndUser.mockResolvedValue(null);
      const createdVote = {
        fixId: 'fix-1',
        userId,
        value: FixVoteValue.LIKE,
      } as FixVote;
      fixVotesRepository.create.mockReturnValue(createdVote);
      const withCounts = {
        ...buildFix({ userId: otherUserId }),
        likes: 1,
        dislikes: 0,
        myVote: FixVoteValue.LIKE,
      };
      fixesRepository.findByIdWithCounts.mockResolvedValue(withCounts);

      const result = await fixesService.vote(
        'fix-1',
        userId,
        FixVoteValue.LIKE,
      );

      expect(fixVotesRepository.create).toHaveBeenCalledWith({
        fixId: 'fix-1',
        userId,
        value: FixVoteValue.LIKE,
      });
      expect(fixVotesRepository.save).toHaveBeenCalledWith(createdVote);
      expect(cache.del).toHaveBeenCalled();
      expect(result).toBe(withCounts);
    });

    it('updates the value of an existing vote', async () => {
      fixesRepository.findById.mockResolvedValue(
        buildFix({ userId: otherUserId }),
      );
      const existingVote = {
        id: 'vote-1',
        fixId: 'fix-1',
        userId,
        value: FixVoteValue.DISLIKE,
      } as FixVote;
      fixVotesRepository.findByFixAndUser.mockResolvedValue(existingVote);
      fixesRepository.findByIdWithCounts.mockResolvedValue({
        ...buildFix({ userId: otherUserId }),
        likes: 1,
        dislikes: 0,
        myVote: FixVoteValue.LIKE,
      });

      await fixesService.vote('fix-1', userId, FixVoteValue.LIKE);

      expect(fixVotesRepository.create).not.toHaveBeenCalled();
      expect(existingVote.value).toBe(FixVoteValue.LIKE);
      expect(fixVotesRepository.save).toHaveBeenCalledWith(existingVote);
    });
  });

  describe('removeVote', () => {
    it('throws NotFoundException when the fix does not exist', async () => {
      fixesRepository.findById.mockResolvedValue(null);

      await expect(fixesService.removeVote('fix-1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when there is no vote to remove', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      fixVotesRepository.findByFixAndUser.mockResolvedValue(null);

      await expect(fixesService.removeVote('fix-1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the vote and evicts the cache', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      fixVotesRepository.findByFixAndUser.mockResolvedValue({
        id: 'vote-1',
      });

      await fixesService.removeVote('fix-1', userId);

      expect(fixVotesRepository.delete).toHaveBeenCalledWith('vote-1');
      expect(cache.del).toHaveBeenCalled();
    });
  });

  describe('cache eviction edge cases', () => {
    it('skips cache eviction when the known issue no longer exists', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      knownIssuesService.findById.mockResolvedValue(null);

      await fixesService.remove('fix-1', userId);

      expect(fixesRepository.delete).toHaveBeenCalledWith('fix-1');
      expect(vehicleModelsService.findById).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('skips cache eviction when the vehicle model no longer exists', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      vehicleModelsService.findById.mockResolvedValue(null);

      await fixesService.remove('fix-1', userId);

      expect(fixesRepository.delete).toHaveBeenCalledWith('fix-1');
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('logs a warning and continues when cache deletion fails', async () => {
      fixesRepository.findById.mockResolvedValue(buildFix());
      cache.del.mockRejectedValue(new Error('redis down'));

      await expect(
        fixesService.remove('fix-1', userId),
      ).resolves.toBeUndefined();
      expect(fixesRepository.delete).toHaveBeenCalledWith('fix-1');
    });
  });
});
