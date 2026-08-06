import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { AdminKnownIssuesController } from './admin-known-issues.controller';

describe('AdminKnownIssuesController', () => {
  let controller: AdminKnownIssuesController;
  let knownIssuesService: {
    findByVehicleModelId: jest.Mock;
    findByIdWithFixes: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  const knownIssue = {
    id: 'ki-1',
    vehicleModelId: 'vm-1',
    title: 'Gearbox',
    description: 'Wears out',
    severity: IssueSeverity.HIGH,
  } as KnownIssue;

  beforeEach(async () => {
    knownIssuesService = {
      findByVehicleModelId: jest.fn(),
      findByIdWithFixes: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminKnownIssuesController],
      providers: [
        { provide: KnownIssuesService, useValue: knownIssuesService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminKnownIssuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('lists known issues for a vehicle model', async () => {
      knownIssuesService.findByVehicleModelId.mockResolvedValue([knownIssue]);

      const result = await controller.findAll({ vehicleModelId: 'vm-1' });

      expect(knownIssuesService.findByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the known issue with its fixes', async () => {
      knownIssuesService.findByIdWithFixes.mockResolvedValue({
        ...knownIssue,
        fixes: [],
      });

      const result = await controller.findOne('ki-1');

      expect(result.id).toBe('ki-1');
      expect(result.fixes).toEqual([]);
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesService.findByIdWithFixes.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates the known issue', async () => {
      knownIssuesService.create.mockResolvedValue(knownIssue);

      const result = await controller.create({
        vehicleModelId: 'vm-1',
        title: 'Gearbox',
        description: 'Wears out',
        severity: IssueSeverity.HIGH,
      });

      expect(knownIssuesService.create).toHaveBeenCalled();
      expect(result.id).toBe('ki-1');
    });
  });

  describe('update', () => {
    it('updates the known issue', async () => {
      const updated = { ...knownIssue, title: 'New title' };
      knownIssuesService.update.mockResolvedValue(updated);

      const result = await controller.update('ki-1', { title: 'New title' });

      expect(knownIssuesService.update).toHaveBeenCalledWith('ki-1', {
        title: 'New title',
      });
      expect(result.title).toBe('New title');
    });
  });

  describe('remove', () => {
    it('soft deletes the known issue', async () => {
      knownIssuesService.softDelete.mockResolvedValue(undefined);

      await controller.remove('ki-1');

      expect(knownIssuesService.softDelete).toHaveBeenCalledWith('ki-1');
    });
  });
});
