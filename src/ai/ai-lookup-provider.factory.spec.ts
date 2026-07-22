import { ConfigService } from '@nestjs/config';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { HttpAiLookupProvider } from './http-ai-lookup.provider';
import { StubAiLookupProvider } from './stub-ai-lookup.provider';

describe('createAiLookupProvider', () => {
  it('returns the stub provider when AI_PROVIDER is unset', () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config);

    expect(provider).toBeInstanceOf(StubAiLookupProvider);
  });

  it('returns the stub provider when AI_PROVIDER is "stub"', () => {
    const config = {
      get: jest.fn().mockReturnValue('stub'),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config);

    expect(provider).toBeInstanceOf(StubAiLookupProvider);
  });

  it('returns the HTTP provider when AI_PROVIDER is "http"', () => {
    const config = {
      get: jest.fn().mockReturnValue('http'),
    } as unknown as ConfigService;

    const provider = createAiLookupProvider(config);

    expect(provider).toBeInstanceOf(HttpAiLookupProvider);
  });
});
