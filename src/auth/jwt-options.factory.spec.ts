import { ConfigService } from '@nestjs/config';
import { createJwtOptions } from './jwt-options.factory';

describe('createJwtOptions', () => {
  it('builds JWT options using the configured expiration', () => {
    const values: Record<string, string> = {
      JWT_SECRET: 'super-secret',
      JWT_EXPIRES_IN: '1h',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const options = createJwtOptions(config);

    expect(options).toEqual({
      secret: 'super-secret',
      signOptions: { expiresIn: '1h' },
    });
  });

  it('falls back to the default expiration when JWT_EXPIRES_IN is not set', () => {
    const config = {
      getOrThrow: jest.fn(() => 'super-secret'),
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    const options = createJwtOptions(config);

    expect(options).toEqual({
      secret: 'super-secret',
      signOptions: { expiresIn: '7d' },
    });
  });
});
