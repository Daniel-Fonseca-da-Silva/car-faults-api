import { ENGINE_OPTIONS, normalizeEngine } from './normalize-engine.util';

describe('normalizeEngine', () => {
  it.each([
    ['1.6', '1.6'],
    [' 1.0 ', '1.0'],
    ['1,6', '1.6'],
    ['1.6 TDI', '1.6'],
    ['Golf 1.6 16v', '1.6'],
    ['2.0l', '2.0'],
    ['1598', '1.6'],
    ['1598cc', '1.6'],
    ['999', '1.0'],
    ['1600 16v', '1.6'],
    ['0.6', '0.6'],
    ['8.0', '8.0'],
    ['8.4', '8.4'],
    ['8285cc', '8.3'],
    ['electric', 'electric'],
    ['Electric', 'electric'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeEngine(input)).toBe(expected);
  });

  it.each(['Golf', 'TDI', '16v', '', '0.5', '8.5', '250', '9.9'])(
    'returns null for %p',
    (input) => {
      expect(normalizeEngine(input)).toBeNull();
    },
  );
});

describe('ENGINE_OPTIONS', () => {
  it('lists every displacement from 0.6 to 8.4 plus electric', () => {
    expect(ENGINE_OPTIONS[0]).toBe('0.6');
    expect(ENGINE_OPTIONS).toContain('1.6');
    expect(ENGINE_OPTIONS.at(-2)).toBe('8.4');
    expect(ENGINE_OPTIONS.at(-1)).toBe('electric');
    expect(ENGINE_OPTIONS).toHaveLength(80);
  });
});
