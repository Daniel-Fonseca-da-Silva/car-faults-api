import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { AdminVehicleModelsController } from './admin-vehicle-models.controller';

describe('AdminVehicleModelsController', () => {
  let controller: AdminVehicleModelsController;
  let vehicleModelsService: {
    findPaginated: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let knownIssuesService: {
    findByVehicleModelId: jest.Mock;
    findByVehicleModelIdAndLocale: jest.Mock;
  };

  const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;

  beforeEach(async () => {
    vehicleModelsService = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    knownIssuesService = {
      findByVehicleModelId: jest.fn(),
      findByVehicleModelIdAndLocale: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminVehicleModelsController],
      providers: [
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: KnownIssuesService, useValue: knownIssuesService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminVehicleModelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('paginates using the default page and limit when omitted', async () => {
      vehicleModelsService.findPaginated.mockResolvedValue({
        items: [vehicleModel],
        total: 1,
      });

      const result = await controller.findAll({});

      expect(vehicleModelsService.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        brand: undefined,
        model: undefined,
      });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the vehicle model with all known issues when no locale is given', async () => {
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      knownIssuesService.findByVehicleModelId.mockResolvedValue(knownIssues);

      const result = await controller.findOne('vm-1', {});

      expect(knownIssuesService.findByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(result.vehicle.id).toBe('vm-1');
      expect(result.knownIssues).toHaveLength(1);
    });

    it('filters known issues by locale when given', async () => {
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);

      await controller.findOne('vm-1', { locale: LookupLocale.PtPt });

      expect(
        knownIssuesService.findByVehicleModelIdAndLocale,
      ).toHaveBeenCalledWith('vm-1', LookupLocale.PtPt);
    });

    it('throws NotFoundException when the vehicle model does not exist', async () => {
      vehicleModelsService.findById.mockResolvedValue(null);

      await expect(controller.findOne('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates the vehicle model', async () => {
      vehicleModelsService.create.mockResolvedValue(vehicleModel);

      const result = await controller.create({
        brand: 'Volkswagen',
        model: 'Polo',
        yearFrom: 2001,
        engine: '1.0',
      });

      expect(vehicleModelsService.create).toHaveBeenCalled();
      expect(result.id).toBe('vm-1');
    });
  });

  describe('update', () => {
    it('updates the vehicle model', async () => {
      const updated = { ...vehicleModel, brand: 'Škoda' };
      vehicleModelsService.update.mockResolvedValue(updated);

      const result = await controller.update('vm-1', { brand: 'Škoda' });

      expect(vehicleModelsService.update).toHaveBeenCalledWith('vm-1', {
        brand: 'Škoda',
      });
      expect(result.brand).toBe('Škoda');
    });
  });

  describe('remove', () => {
    it('soft deletes the vehicle model', async () => {
      vehicleModelsService.softDelete.mockResolvedValue(undefined);

      await controller.remove('vm-1');

      expect(vehicleModelsService.softDelete).toHaveBeenCalledWith('vm-1');
    });
  });
});
