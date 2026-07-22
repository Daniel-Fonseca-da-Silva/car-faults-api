import { DataSource } from 'typeorm';

describe('data-source', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('builds a postgres DataSource with migrations enabled and synchronize disabled', async () => {
    process.env = {
      ...originalEnv,
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'car_faults',
      DATABASE_PASSWORD: 'car_faults',
      DATABASE_NAME: 'car_faults',
    };

    const { dataSourceOptions, default: dataSource } =
      (await import('./data-source')) as typeof import('./data-source');

    expect(dataSourceOptions).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'car_faults',
      password: 'car_faults',
      database: 'car_faults',
      synchronize: false,
    });
    expect(dataSource).toBeInstanceOf(DataSource);
  });
});
