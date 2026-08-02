import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { PlatformController } from './platform.controller';
import { TOP_FAULTS_DEFAULT_LIMIT } from './platform.constants';
import { PlatformService } from './platform.service';

describe('PlatformController', () => {
  let platformController: PlatformController;
  let platformService: { getStats: jest.Mock; getTopFaults: jest.Mock };

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
      getTopFaults: jest.fn().mockResolvedValue([topFaultRow]),
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

  describe('getTopFaults', () => {
    it('defaults locale to en-GB and limit to the configured default when omitted', async () => {
      const result = await platformController.getTopFaults({});

      expect(platformService.getTopFaults).toHaveBeenCalledWith(
        LookupLocale.EnGb,
        TOP_FAULTS_DEFAULT_LIMIT,
      );
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
      });
    });

    it('omits fuelType and doors from the vehicle when the vehicle model has none on record', async () => {
      platformService.getTopFaults.mockResolvedValue([
        { ...topFaultRow, vehicleFuelType: null, vehicleDoors: null },
      ]);

      const result = await platformController.getTopFaults({});

      expect(result.items[0].vehicle.fuelType).toBeUndefined();
      expect(result.items[0].vehicle.doors).toBeUndefined();
    });

    it('passes through the given locale and limit', async () => {
      await platformController.getTopFaults({
        locale: LookupLocale.PtPt,
        limit: 12,
      });

      expect(platformService.getTopFaults).toHaveBeenCalledWith(
        LookupLocale.PtPt,
        12,
      );
    });

    it('returns an empty items array when there are no top faults', async () => {
      platformService.getTopFaults.mockResolvedValue([]);

      const result = await platformController.getTopFaults({});

      expect(result).toEqual({ items: [] });
    });
  });
});
