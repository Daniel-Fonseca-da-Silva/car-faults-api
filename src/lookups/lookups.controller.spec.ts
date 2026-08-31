import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { LookupByPathQueryDto } from './dto/lookup-by-path-query.dto';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

describe('LookupsController', () => {
  let lookupsController: LookupsController;
  let lookupsService: { lookup: jest.Mock; lookupByPath: jest.Mock };
  let activityLogService: { recordSearch: jest.Mock };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;
  const anonymousReq = { user: null } as unknown as Request;

  const query: LookupQueryDto = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    fuelType: FuelType.DIESEL,
  };
  const response = {
    vehicle: {},
    knownIssues: [],
  } as unknown as LookupResponseDto;

  beforeEach(async () => {
    lookupsService = { lookup: jest.fn(), lookupByPath: jest.fn() };
    activityLogService = {
      recordSearch: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [
        { provide: LookupsService, useValue: lookupsService },
        { provide: ActivityLogService, useValue: activityLogService },
      ],
    })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    lookupsController = module.get(LookupsController);
  });

  it('should be defined', () => {
    expect(lookupsController).toBeDefined();
  });

  describe('lookup', () => {
    it('delegates to the service and returns its result', async () => {
      lookupsService.lookup.mockResolvedValue(response);

      const result = await lookupsController.lookup(anonymousReq, query);

      expect(lookupsService.lookup).toHaveBeenCalledWith(query, {
        clientType: 'web',
        clientIp: undefined,
        turnstileToken: undefined,
      });
      expect(result).toBe(response);
    });

    it('forwards the x-turnstile-token header to the service', async () => {
      lookupsService.lookup.mockResolvedValue(response);

      await lookupsController.lookup(anonymousReq, query, 'turnstile-token');

      expect(lookupsService.lookup).toHaveBeenCalledWith(query, {
        clientType: 'web',
        clientIp: undefined,
        turnstileToken: 'turnstile-token',
      });
    });

    it('does not record a search when the request is anonymous', async () => {
      lookupsService.lookup.mockResolvedValue(response);

      await lookupsController.lookup(anonymousReq, query);

      expect(activityLogService.recordSearch).not.toHaveBeenCalled();
    });

    it('records a search with the lookup criteria for an authenticated user', async () => {
      lookupsService.lookup.mockResolvedValue(response);

      await lookupsController.lookup(req, query);

      expect(activityLogService.recordSearch).toHaveBeenCalledWith('user-1', {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.DIESEL,
      });
    });

    it('includes doors in the search metadata when present', async () => {
      lookupsService.lookup.mockResolvedValue(response);

      await lookupsController.lookup(req, { ...query, doors: 3 });

      expect(activityLogService.recordSearch).toHaveBeenCalledWith('user-1', {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.DIESEL,
        doors: 3,
      });
    });
  });

  describe('lookupByPath', () => {
    const pathQuery: LookupByPathQueryDto = {
      make: 'volkswagen',
      model: 'polo',
      year: 2001,
      fuelType: FuelType.DIESEL,
      engine: '1-0',
    };

    it('delegates to the service and returns its result', async () => {
      lookupsService.lookupByPath.mockResolvedValue(response);

      const result = await lookupsController.lookupByPath(pathQuery);

      expect(lookupsService.lookupByPath).toHaveBeenCalledWith(pathQuery);
      expect(result).toBe(response);
    });
  });
});
