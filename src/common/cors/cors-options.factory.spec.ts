import { createCorsOptions } from './cors-options.factory';

describe('createCorsOptions', () => {
  it('parses a CSV of origins into a trimmed list and enables credentials', () => {
    const options = createCorsOptions(
      'https://a.example.com, https://b.example.com ,https://c.example.com',
    );

    expect(options).toEqual({
      origin: [
        'https://a.example.com',
        'https://b.example.com',
        'https://c.example.com',
      ],
      credentials: true,
    });
  });

  it('filters out empty values produced by extra commas', () => {
    const options = createCorsOptions('https://a.example.com,,  ,');

    expect(options).toEqual({
      origin: ['https://a.example.com'],
      credentials: true,
    });
  });

  it('returns an empty origin list when given an empty string', () => {
    const options = createCorsOptions('');

    expect(options).toEqual({ origin: [], credentials: true });
  });
});
