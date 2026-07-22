import { Test, TestingModule } from '@nestjs/testing';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

describe('LookupsController', () => {
  let lookupsController: LookupsController;
  let lookupsService: { lookup: jest.Mock };

  beforeEach(async () => {
    lookupsService = { lookup: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [{ provide: LookupsService, useValue: lookupsService }],
    }).compile();

    lookupsController = module.get(LookupsController);
  });

  it('should be defined', () => {
    expect(lookupsController).toBeDefined();
  });

  describe('lookup', () => {
    it('delegates to the service', async () => {
      const query: LookupQueryDto = {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
      };
      const response = {
        vehicle: {},
        knownIssues: [],
      } as unknown as LookupResponseDto;
      lookupsService.lookup.mockResolvedValue(response);

      const result = await lookupsController.lookup(query);

      expect(lookupsService.lookup).toHaveBeenCalledWith(query);
      expect(result).toBe(response);
    });
  });
});
