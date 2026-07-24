import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateFixDto } from './dto/create-fix.dto';
import { ListFixesQueryDto } from './dto/list-fixes-query.dto';
import { UpdateFixDto } from './dto/update-fix.dto';
import { VoteFixDto } from './dto/vote-fix.dto';
import { FixSource } from './enums/fix-source.enum';
import { FixVoteValue } from './enums/fix-vote-value.enum';
import { FixesController } from './fixes.controller';
import { FixWithCounts } from './fixes.repository';
import { FixesService } from './fixes.service';

describe('FixesController', () => {
  let fixesController: FixesController;
  let fixesService: {
    findByKnownIssue: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    vote: jest.Mock;
    removeVote: jest.Mock;
  };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;
  const anonymousReq = { user: null } as unknown as Request;

  const fix = {
    id: 'fix-1',
    knownIssueId: 'ki-1',
    userId: 'user-1',
    summary: 'Replace synchros',
    steps: 'Remove gearbox and replace synchro rings.',
    estimatedCostEur: null,
    source: FixSource.USER,
    likes: 0,
    dislikes: 0,
    myVote: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as unknown as FixWithCounts;

  beforeEach(async () => {
    fixesService = {
      findByKnownIssue: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      vote: jest.fn(),
      removeVote: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixesController],
      providers: [{ provide: FixesService, useValue: fixesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    fixesController = module.get(FixesController);
  });

  it('should be defined', () => {
    expect(fixesController).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the serialized fixes for a known issue, passing the anonymous user id', async () => {
      fixesService.findByKnownIssue.mockResolvedValue([fix]);
      const query: ListFixesQueryDto = { knownIssueId: 'ki-1' };

      const result = await fixesController.findAll(anonymousReq, query);

      expect(fixesService.findByKnownIssue).toHaveBeenCalledWith(
        'ki-1',
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'fix-1' });
    });

    it('passes the authenticated user id to populate myVote', async () => {
      fixesService.findByKnownIssue.mockResolvedValue([fix]);
      const query: ListFixesQueryDto = { knownIssueId: 'ki-1' };

      await fixesController.findAll(req, query);

      expect(fixesService.findByKnownIssue).toHaveBeenCalledWith(
        'ki-1',
        'user-1',
      );
    });
  });

  describe('create', () => {
    it('creates a fix for the authenticated user', async () => {
      const dto: CreateFixDto = {
        knownIssueId: 'ki-1',
        summary: 'Replace synchros',
        steps: 'Remove gearbox and replace synchro rings.',
      };
      fixesService.create.mockResolvedValue(fix);

      const result = await fixesController.create(req, dto);

      expect(fixesService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({ id: 'fix-1' });
    });
  });

  describe('update', () => {
    it("updates the authenticated user's fix", async () => {
      const dto: UpdateFixDto = { summary: 'Updated summary' };
      const updated = { ...fix, summary: 'Updated summary' };
      fixesService.update.mockResolvedValue(updated);

      const result = await fixesController.update(req, 'fix-1', dto);

      expect(fixesService.update).toHaveBeenCalledWith('fix-1', 'user-1', dto);
      expect(result).toMatchObject({ summary: 'Updated summary' });
    });
  });

  describe('remove', () => {
    it("removes the authenticated user's fix", async () => {
      fixesService.remove.mockResolvedValue(undefined);

      await fixesController.remove(req, 'fix-1');

      expect(fixesService.remove).toHaveBeenCalledWith('fix-1', 'user-1');
    });
  });

  describe('vote', () => {
    it('votes on a fix for the authenticated user', async () => {
      const dto: VoteFixDto = { value: FixVoteValue.LIKE };
      const voted = { ...fix, likes: 1, myVote: FixVoteValue.LIKE };
      fixesService.vote.mockResolvedValue(voted);

      const result = await fixesController.vote(req, 'fix-1', dto);

      expect(fixesService.vote).toHaveBeenCalledWith(
        'fix-1',
        'user-1',
        FixVoteValue.LIKE,
      );
      expect(result).toMatchObject({ likes: 1, myVote: FixVoteValue.LIKE });
    });
  });

  describe('removeVote', () => {
    it("removes the authenticated user's vote", async () => {
      fixesService.removeVote.mockResolvedValue(undefined);

      await fixesController.removeVote(req, 'fix-1');

      expect(fixesService.removeVote).toHaveBeenCalledWith('fix-1', 'user-1');
    });
  });
});
