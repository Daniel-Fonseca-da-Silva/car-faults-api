import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { KnownIssueWithCommentCount } from '../known-issues/known-issues.repository';
import { TOP_FAULTS_DEFAULT_LIMIT } from './dto/top-faults-query.dto';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

describe('PlatformController', () => {
  let platformController: PlatformController;
  let platformService: { getStats: jest.Mock; getTopFaults: jest.Mock };

  const stats = { reportsCount: 128, vehiclesCount: 42, faultsCount: 96 };

  const topFaults = [
    {
      id: 'ki-1',
      title: 'Problematic gearbox',
      severity: IssueSeverity.HIGH,
      commentCount: 5,
      vehicleModel: {
        brand: 'Volkswagen',
        model: 'Polo',
        yearFrom: 1994,
        engine: '1.0',
        fuelType: null,
        doors: null,
      },
    },
  ] as unknown as KnownIssueWithCommentCount[];

  beforeEach(async () => {
    platformService = {
      getStats: jest.fn().mockResolvedValue(stats),
      getTopFaults: jest.fn().mockResolvedValue(topFaults),
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
    it('delegates to the service and wraps the result in the response DTO', async () => {
      const result = await platformController.getStats();

      expect(platformService.getStats).toHaveBeenCalledWith();
      expect(result).toEqual(stats);
    });
  });

  describe('getTopFaults', () => {
    it('defaults the locale to en-GB and the limit when omitted', async () => {
      const result = await platformController.getTopFaults({});

      expect(platformService.getTopFaults).toHaveBeenCalledWith(
        LookupLocale.EnGb,
        TOP_FAULTS_DEFAULT_LIMIT,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'ki-1',
        faultTitle: 'Problematic gearbox',
        severity: IssueSeverity.HIGH,
        reportCount: 5,
        vehicle: {
          brand: 'Volkswagen',
          model: 'Polo',
          yearFrom: 1994,
          engine: '1.0',
        },
      });
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
  });
});
