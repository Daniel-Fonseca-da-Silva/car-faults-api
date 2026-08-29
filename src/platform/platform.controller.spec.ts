import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { PlatformController } from './platform.controller';
import {
  FAULTS_DEFAULT_LIMIT,
  VEHICLES_DEFAULT_LIMIT,
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
        .mockResolvedValue({ items: [topFaultRow], nextCursor: null }),
      getVehicles: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
    it('defaults locale and limit to the configured defaults when omitted', async () => {
      const result = await platformController.getFaults({});

      expect(platformService.getFaults).toHaveBeenCalledWith({
        locale: LookupLocale.EnGb,
        limit: FAULTS_DEFAULT_LIMIT,
        cursor: undefined,
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
        nextCursor: null,
      });
    });

    it('omits fuelType and doors from the vehicle when the vehicle model has none on record', async () => {
      platformService.getFaults.mockResolvedValue({
        items: [{ ...topFaultRow, vehicleFuelType: null, vehicleDoors: null }],
        nextCursor: null,
      });

      const result = await platformController.getFaults({});

      expect(result.items[0].vehicle.fuelType).toBeUndefined();
      expect(result.items[0].vehicle.doors).toBeUndefined();
    });

    it('passes through the given locale, cursor, limit and filters, and clamps limit to the maximum', async () => {
      await platformController.getFaults({
        locale: LookupLocale.PtPt,
        cursor: 'abc',
        limit: 500,
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2018,
        engine: '1.6 TDI',
        fuelType: FuelType.DIESEL,
        doors: 5,
      });

      expect(platformService.getFaults).toHaveBeenCalledWith({
        locale: LookupLocale.PtPt,
        cursor: 'abc',
        limit: 48,
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2018,
        engine: '1.6 TDI',
        fuelType: FuelType.DIESEL,
        doors: 5,
      });
    });

    it('returns an empty items array when there are no faults', async () => {
      platformService.getFaults.mockResolvedValue({
        items: [],
        nextCursor: null,
      });

      const result = await platformController.getFaults({});

      expect(result).toEqual({ items: [], nextCursor: null });
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

    it('defaults limit to the configured default when omitted', async () => {
      platformService.getVehicles.mockResolvedValue({
        items: [vehicleModel],
        nextCursor: null,
      });

      const result = await platformController.getVehicles({});

      expect(platformService.getVehicles).toHaveBeenCalledWith({
        limit: VEHICLES_DEFAULT_LIMIT,
        cursor: undefined,
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
        nextCursor: null,
      });
    });

    it('passes through the given cursor and limit', async () => {
      await platformController.getVehicles({ cursor: 'abc', limit: 100 });

      expect(platformService.getVehicles).toHaveBeenCalledWith({
        cursor: 'abc',
        limit: 100,
      });
    });

    it('omits doors from the vehicle item when the vehicle model has none on record', async () => {
      platformService.getVehicles.mockResolvedValue({
        items: [{ ...vehicleModel, doors: null }],
        nextCursor: null,
      });

      const result = await platformController.getVehicles({});

      expect(result.items[0].doors).toBeUndefined();
    });
  });
});
