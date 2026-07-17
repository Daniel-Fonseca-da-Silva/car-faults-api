import { ConfigService } from '@nestjs/config';
import { createTypeOrmOptions } from './database-options.factory';

describe('createTypeOrmOptions', () => {
  it('builds postgres connection options from ConfigService', () => {
    const values: Record<string, string> = {
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'car_faults',
      DATABASE_PASSWORD: 'car_faults',
      DATABASE_NAME: 'car_faults',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const options = createTypeOrmOptions(config);

    expect(options).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'car_faults',
      password: 'car_faults',
      database: 'car_faults',
      autoLoadEntities: true,
      synchronize: false,
    });
  });

  it('throws when a required variable is missing', () => {
    const config = {
      getOrThrow: jest.fn(() => {
        throw new Error('DATABASE_HOST is not defined');
      }),
    } as unknown as ConfigService;

    expect(() => createTypeOrmOptions(config)).toThrow(
      'DATABASE_HOST is not defined',
    );
  });
});
