import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { AiTranslateInput } from './ai-translate.provider';
import { HttpAiTranslateProvider } from './http-ai-translate.provider';

describe('HttpAiTranslateProvider', () => {
  let provider: HttpAiTranslateProvider;
  let configService: { getOrThrow: jest.Mock; get: jest.Mock };
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  const input: AiTranslateInput = {
    sourceLanguage: LookupLocale.EnGb,
    targetLanguage: LookupLocale.PtPt,
    knownIssues: [
      {
        title: 'Gearbox',
        description: 'Wears out',
        severity: IssueSeverity.HIGH,
        typicalKm: 120000,
        sources: ['https://example.com'],
        fixes: [{ summary: 'Replace synchros', steps: 'Do it' }],
      },
    ],
  };

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://ai.example.com/translate'),
      get: jest.fn().mockReturnValue('secret-key'),
    };
    provider = new HttpAiTranslateProvider(
      configService as unknown as ConfigService,
    );
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('translate', () => {
    it('posts the input to AI_TRANSLATE_URL with the bearer token and returns the parsed JSON', async () => {
      const aiResult = { knownIssues: input.knownIssues };
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(aiResult),
      } as unknown as Response);

      const result = await provider.translate(input);

      expect(configService.getOrThrow).toHaveBeenCalledWith('AI_TRANSLATE_URL');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://ai.example.com/translate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer secret-key',
          },
          body: JSON.stringify(input),
        },
      );
      expect(result).toEqual(aiResult);
    });

    it('omits the Authorization header when no API key is configured', async () => {
      configService.get.mockReturnValue(undefined);
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ knownIssues: [] }),
      } as unknown as Response);

      await provider.translate(input);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://ai.example.com/translate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        },
      );
    });

    it('throws ServiceUnavailableException when fetch rejects', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));

      await expect(provider.translate(input)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when the response is not ok', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn(),
      } as unknown as Response);

      await expect(provider.translate(input)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
