import { slugify } from './slugify.util';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Volkswagen Golf')).toBe('volkswagen-golf');
  });

  it('strips diacritics', () => {
    expect(slugify('Škoda Œconomy')).toBe('skoda-conomy');
  });

  it('collapses consecutive non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('2.0 TDI')).toBe('2-0-tdi');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  Mercedes-Benz  ')).toBe('mercedes-benz');
  });
});
