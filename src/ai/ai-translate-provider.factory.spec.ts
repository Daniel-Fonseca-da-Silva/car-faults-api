import { ConfigService } from '@nestjs/config';
import { createAiTranslateProvider } from './ai-translate-provider.factory';
import { HttpAiTranslateProvider } from './http-ai-translate.provider';
import { StubAiTranslateProvider } from './stub-ai-translate.provider';

describe('createAiTranslateProvider', () => {
  it('returns the stub provider when AI_PROVIDER is unset', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config);

    expect(provider).toBeInstanceOf(StubAiTranslateProvider);
  });

  it('returns the stub provider when AI_PROVIDER is "stub"', () => {
    const config = {
      get: jest.fn().mockReturnValue('stub'),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config);

    expect(provider).toBeInstanceOf(StubAiTranslateProvider);
  });

  it('returns the HTTP provider when AI_PROVIDER is "http"', () => {
    const config = {
      get: jest.fn().mockReturnValue('http'),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config);

    expect(provider).toBeInstanceOf(HttpAiTranslateProvider);
  });
});
