import { ConfigService } from '@nestjs/config';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { HttpAiLookupProvider } from './http-ai-lookup.provider';
import { StubAiLookupProvider } from './stub-ai-lookup.provider';

describe('createAiLookupProvider', () => {
  it('returns the stub provider when AI_PROVIDER is unset', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config, 'development');

    expect(provider).toBeInstanceOf(StubAiLookupProvider);
  });

  it('returns the stub provider when AI_PROVIDER is "stub"', () => {
    const config = {
      get: jest.fn().mockReturnValue('stub'),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config, 'development');

    expect(provider).toBeInstanceOf(StubAiLookupProvider);
  });

  it('returns the HTTP provider when AI_PROVIDER is "http"', () => {
    const getOrThrow = jest
      .fn()
      .mockReturnValue('https://ai.example.com/lookup');
    const config = {
      get: jest.fn().mockReturnValue('http'),
      getOrThrow,
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config, 'development');

    expect(provider).toBeInstanceOf(HttpAiLookupProvider);
    expect(getOrThrow).toHaveBeenCalledWith('AI_API_URL');
  });

  it('throws in production when AI_PROVIDER is not "http"', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    expect(() => createAiLookupProvider(config, 'production')).toThrow(
      /AI_PROVIDER must be "http"/,
    );
  });

  it('does not throw in production when AI_PROVIDER is "http"', () => {
    const config = {
      get: jest.fn().mockReturnValue('http'),
      getOrThrow: jest.fn().mockReturnValue('https://ai.example.com/lookup'),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config, 'production');

    expect(provider).toBeInstanceOf(HttpAiLookupProvider);
  });
});
