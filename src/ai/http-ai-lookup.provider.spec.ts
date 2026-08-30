import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { HttpAiLookupProvider } from './http-ai-lookup.provider';

describe('HttpAiLookupProvider', () => {
  let provider: HttpAiLookupProvider;
  let configService: { getOrThrow: jest.Mock; get: jest.Mock };
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  const input = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    fuelType: FuelType.DIESEL,
    language: LookupLocale.EnGb,
  };

  const vehicleResult = {
    brand: 'Volkswagen',
    model: 'Polo',
    name: 'Polo 6N1',
    year: 2001,
    engine: '1.0',
    fuelType: FuelType.DIESEL,
  };

  const aiResult = { vehicle: vehicleResult, knownIssues: [] };

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://ai.example.com/lookup'),
      get: jest.fn().mockReturnValue('secret-key'),
    };
    provider = new HttpAiLookupProvider(
      configService as unknown as ConfigService,
    );
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('generateLookup', () => {
    it('posts the input to AI_API_URL with the bearer token and returns the parsed JSON', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(aiResult),
      } as unknown as Response);

      const result = await provider.generateLookup(input);

      expect(configService.getOrThrow).toHaveBeenCalledWith('AI_API_URL');
      expect(fetchSpy).toHaveBeenCalledWith('https://ai.example.com/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secret-key',
        },
        body: JSON.stringify(input),
      });
      expect(result).toEqual(aiResult);
    });

    it('omits the Authorization header when no API key is configured', async () => {
      configService.get.mockReturnValue(undefined);
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(aiResult),
      } as unknown as Response);

      await provider.generateLookup(input);

      expect(fetchSpy).toHaveBeenCalledWith('https://ai.example.com/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
    });

    it('throws ServiceUnavailableException when fetch rejects', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));

      await expect(provider.generateLookup(input)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when the response is not ok', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn(),
      } as unknown as Response);

      await expect(provider.generateLookup(input)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    describe('sidecar retry', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('retries once on a fast 503 and succeeds', async () => {
        fetchSpy
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
            json: jest.fn(),
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(aiResult),
          } as unknown as Response);

        const resultPromise = provider.generateLookup(input);
        await jest.advanceTimersByTimeAsync(1000);

        await expect(resultPromise).resolves.toEqual(aiResult);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      it('does not retry a 503 that took longer than 5s', async () => {
        fetchSpy.mockImplementationOnce(() => {
          jest.advanceTimersByTime(6000);
          return Promise.resolve({
            ok: false,
            status: 503,
            json: jest.fn(),
          } as unknown as Response);
        });

        await expect(provider.generateLookup(input)).rejects.toThrow(
          ServiceUnavailableException,
        );
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      it('retries once when fetch rejects and succeeds on the second call', async () => {
        fetchSpy
          .mockRejectedValueOnce(new Error('network down'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(aiResult),
          } as unknown as Response);

        const resultPromise = provider.generateLookup(input);
        await jest.advanceTimersByTimeAsync(1000);

        await expect(resultPromise).resolves.toEqual(aiResult);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      it('does not retry a 400', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn(),
        } as unknown as Response);

        await expect(provider.generateLookup(input)).rejects.toThrow(
          ServiceUnavailableException,
        );
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
