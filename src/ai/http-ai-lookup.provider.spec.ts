import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  };

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
      const aiResult = { vehicle: input, knownIssues: [] };
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
        json: jest.fn().mockResolvedValue({ vehicle: input, knownIssues: [] }),
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
  });
});
