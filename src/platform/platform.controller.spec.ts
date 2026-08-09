import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { PlatformController } from './platform.controller';
import {
  FAULTS_DEFAULT_LIMIT,
  FAULTS_DEFAULT_PAGE,
  VEHICLES_DEFAULT_LIMIT,
  VEHICLES_DEFAULT_PAGE,
} from './platform.constants';
import { PlatformService } from './platform.service';

describe('PlatformController', () => {
  let platformController: PlatformController;
  let platformService: {
    getStats: jest.Mock;
    getFaults: jest.Mock;
    getVehicles: jest.Mock;
  };

  const stats = {
    reportsCount: 128340,
    vehiclesCount: 8400,
    faultsCount: 34000,
  };

  const topFaultRow: TopFaultRow = {
    id: 'ki-1',
    title: 'Timing chain tensioner wear',
    severity: IssueSeverity.HIGH,
    reportCount: 412,
    vehicleBrand: 'Volkswagen',
    vehicleModel: 'Golf',
    vehicleYearFrom: 2015,
    vehicleEngine: '1.6 TDI',
    vehicleFuelType: FuelType.DIESEL,
    vehicleDoors: 5,
  };

  beforeEach(async () => {
    platformService = {
      getStats: jest.fn().mockResolvedValue(stats),
      getFaults: jest
        .fn()
        .mockResolvedValue({ items: [topFaultRow], total: 1 }),
      getVehicles: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformController],
      providers: [{ provide: PlatformService, useValue: platformService }],
    }).compile();

    platformController = module.get(PlatformController);
  });

  it('should be defined', () => {
    expect(platformController).toBeDefined();
  });

  describe('getStats', () => {
    it('returns the platform stats', async () => {
      const result = await platformController.getStats();

      expect(platformService.getStats).toHaveBeenCalledWith();
      expect(result).toEqual(stats);
    });
  });

  describe('getFaults', () => {
    it('defaults locale, page and limit to the configured defaults when omitted', async () => {
      const result = await platformController.getFaults({});

      expect(platformService.getFaults).toHaveBeenCalledWith({
        locale: LookupLocale.EnGb,
        page: FAULTS_DEFAULT_PAGE,
        limit: FAULTS_DEFAULT_LIMIT,
        brand: undefined,
        model: undefined,
        year: undefined,
        engine: undefined,
        fuelType: undefined,
        doors: undefined,
      });
      expect(result).toEqual({
        items: [
          {
            id: 'ki-1',
            faultTitle: 'Timing chain tensioner wear',
            severity: IssueSeverity.HIGH,
            reportCount: 412,
            vehicle: {
              brand: 'Volkswagen',
              model: 'Golf',
              yearFrom: 2015,
              engine: '1.6 TDI',
              fuelType: FuelType.DIESEL,
              doors: 5,
            },
          },
        ],
        total: 1,
        page: FAULTS_DEFAULT_PAGE,
        limit: FAULTS_DEFAULT_LIMIT,
      });
    });

    it('omits fuelType and doors from the vehicle when the vehicle model has none on record', async () => {
      platformService.getFaults.mockResolvedValue({
        items: [{ ...topFaultRow, vehicleFuelType: null, vehicleDoors: null }],
        total: 1,
      });

      const result = await platformController.getFaults({});

      expect(result.items[0].vehicle.fuelType).toBeUndefined();
      expect(result.items[0].vehicle.doors).toBeUndefined();
    });

    it('passes through the given locale, page, limit and filters', async () => {
      await platformController.getFaults({
        locale: LookupLocale.PtPt,
        page: 2,
        limit: 12,
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2018,
        engine: '1.6 TDI',
        fuelType: FuelType.DIESEL,
        doors: 5,
      });

      expect(platformService.getFaults).toHaveBeenCalledWith({
        locale: LookupLocale.PtPt,
        page: 2,
        limit: 12,
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2018,
        engine: '1.6 TDI',
        fuelType: FuelType.DIESEL,
        doors: 5,
      });
    });

    it('returns an empty items array when there are no faults', async () => {
      platformService.getFaults.mockResolvedValue({ items: [], total: 0 });

      const result = await platformController.getFaults({});

      expect(result).toEqual({
        items: [],
        total: 0,
        page: FAULTS_DEFAULT_PAGE,
        limit: FAULTS_DEFAULT_LIMIT,
      });
    });
  });

  describe('getVehicles', () => {
    const vehicleModel = {
      brand: 'Volkswagen',
      model: 'Golf',
      yearFrom: 2018,
      engine: '2.0 TDI',
      fuelType: FuelType.DIESEL,
      doors: 5,
    } as VehicleModel;

    it('defaults page and limit to the configured defaults when omitted', async () => {
      platformService.getVehicles.mockResolvedValue({
        items: [vehicleModel],
        total: 1,
      });

      const result = await platformController.getVehicles({});

      expect(platformService.getVehicles).toHaveBeenCalledWith({
        page: VEHICLES_DEFAULT_PAGE,
        limit: VEHICLES_DEFAULT_LIMIT,
      });
      expect(result).toEqual({
        items: [
          {
            brand: 'Volkswagen',
            model: 'Golf',
            yearFrom: 2018,
            engine: '2.0 TDI',
            fuelType: FuelType.DIESEL,
            doors: 5,
          },
        ],
        total: 1,
        page: VEHICLES_DEFAULT_PAGE,
        limit: VEHICLES_DEFAULT_LIMIT,
      });
    });

    it('passes through the given page and limit', async () => {
      await platformController.getVehicles({ page: 3, limit: 100 });

      expect(platformService.getVehicles).toHaveBeenCalledWith({
        page: 3,
        limit: 100,
      });
    });

    it('omits doors from the vehicle item when the vehicle model has none on record', async () => {
      platformService.getVehicles.mockResolvedValue({
        items: [{ ...vehicleModel, doors: null }],
        total: 1,
      });

      const result = await platformController.getVehicles({});

      expect(result.items[0].doors).toBeUndefined();
    });
  });
});
