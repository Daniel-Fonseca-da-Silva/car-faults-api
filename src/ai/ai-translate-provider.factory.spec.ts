import { ConfigService } from '@nestjs/config';
import { createAiTranslateProvider } from './ai-translate-provider.factory';
import { HttpAiTranslateProvider } from './http-ai-translate.provider';
import { StubAiTranslateProvider } from './stub-ai-translate.provider';

describe('createAiTranslateProvider', () => {
  it('returns the stub provider when AI_PROVIDER is unset', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config, 'development');

    expect(provider).toBeInstanceOf(StubAiTranslateProvider);
  });

  it('returns the stub provider when AI_PROVIDER is "stub"', () => {
    const config = {
      get: jest.fn().mockReturnValue('stub'),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config, 'development');

    expect(provider).toBeInstanceOf(StubAiTranslateProvider);
  });

  it('returns the HTTP provider when AI_PROVIDER is "http"', () => {
    const getOrThrow = jest
      .fn()
      .mockReturnValue('https://ai.example.com/translate');
    const config = {
      get: jest.fn().mockReturnValue('http'),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config, 'development');

    expect(provider).toBeInstanceOf(HttpAiTranslateProvider);
    expect(getOrThrow).toHaveBeenCalledWith('AI_TRANSLATE_URL');
  });

  it('throws in production when AI_PROVIDER is not "http"', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    expect(() => createAiTranslateProvider(config, 'production')).toThrow(
      /AI_PROVIDER must be "http"/,
    );
  });

  it('does not throw in production when AI_PROVIDER is "http"', () => {
    const config = {
      get: jest.fn().mockReturnValue('http'),
      getOrThrow: jest.fn().mockReturnValue('https://ai.example.com/translate'),
    } as unknown as ConfigService;

    const provider = createAiTranslateProvider(config, 'production');

    expect(provider).toBeInstanceOf(HttpAiTranslateProvider);
  });
});
