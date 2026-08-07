import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Fix } from '../fixes/entities/fix.entity';
import { FixSource } from '../fixes/enums/fix-source.enum';
import { FixesService } from '../fixes/fixes.service';
import { AdminFixesController } from './admin-fixes.controller';

describe('AdminFixesController', () => {
  let controller: AdminFixesController;
  let fixesService: {
    findById: jest.Mock;
    adminCreate: jest.Mock;
    adminUpdate: jest.Mock;
    adminRemove: jest.Mock;
  };

  const fix = {
    id: 'fix-1',
    knownIssueId: 'ki-1',
    userId: null,
    summary: 'Replace synchros',
    steps: 'Remove gearbox and replace synchro rings.',
    estimatedCostEur: null,
    source: FixSource.AI,
  } as Fix;

  beforeEach(async () => {
    fixesService = {
      findById: jest.fn(),
      adminCreate: jest.fn(),
      adminUpdate: jest.fn(),
      adminRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFixesController],
      providers: [{ provide: FixesService, useValue: fixesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminFixesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('returns the fix', async () => {
      fixesService.findById.mockResolvedValue(fix);

      const result = await controller.findOne('fix-1');

      expect(result.id).toBe('fix-1');
    });

    it('throws NotFoundException when the fix does not exist', async () => {
      fixesService.findById.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates the fix with no userId, AI source', async () => {
      fixesService.adminCreate.mockResolvedValue({
        ...fix,
        likes: 0,
        dislikes: 0,
        myVote: null,
      });

      const result = await controller.create({
        knownIssueId: 'ki-1',
        summary: 'Replace synchros',
        steps: 'Remove gearbox and replace synchro rings.',
      });

      expect(fixesService.adminCreate).toHaveBeenCalled();
      expect(result.userId).toBeNull();
      expect(result.source).toBe(FixSource.AI);
    });
  });

  describe('update', () => {
    it('updates the fix', async () => {
      fixesService.adminUpdate.mockResolvedValue({
        ...fix,
        summary: 'Updated summary',
        likes: 0,
        dislikes: 0,
        myVote: null,
      });

      const result = await controller.update('fix-1', {
        summary: 'Updated summary',
      });

      expect(fixesService.adminUpdate).toHaveBeenCalledWith('fix-1', {
        summary: 'Updated summary',
      });
      expect(result.summary).toBe('Updated summary');
    });
  });

  describe('remove', () => {
    it('removes the fix', async () => {
      fixesService.adminRemove.mockResolvedValue(undefined);

      await controller.remove('fix-1');

      expect(fixesService.adminRemove).toHaveBeenCalledWith('fix-1');
    });
  });
});
