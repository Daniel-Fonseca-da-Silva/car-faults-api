export const ELECTRIC_ENGINE = 'electric';
export const MIN_ENGINE_LITRES = 0.6;
export const MAX_ENGINE_LITRES = 8.4;

const LITRES_STEP = 0.1;

/**
 * Every engine value a lookup accepts: displacements in litres ("0.6" to
 * "8.4", one decimal) plus the electric sentinel, which the clients send for
 * vehicles with no combustion engine.
 */
export const ENGINE_OPTIONS: readonly string[] = [
  ...Array.from(
    {
      length:
        Math.round((MAX_ENGINE_LITRES - MIN_ENGINE_LITRES) / LITRES_STEP) + 1,
    },
    (_, index) => (MIN_ENGINE_LITRES + index * LITRES_STEP).toFixed(1),
  ),
  ELECTRIC_ENGINE,
];

// "1.6", "1,6", "1.6 TDI", "Golf 1.6 16v" — the first litre figure wins.
const LITRES_PATTERN = /(?<!\d)(\d)[.,](\d)/;
// "1598", "1598cc", "1600 16v" — cubic centimetres, rounded to 0.1 L.
const CUBIC_CENTIMETRES_PATTERN = /(?<!\d)(\d{3,4})(?!\d)/;

/**
 * Reduces free-text engine input to the canonical "X.Y" litre form, so the
 * same engine typed different ways resolves to one vehicle, one cache entry
 * and one AI lookup. Returns null when no displacement within range can be
 * read (e.g. the user typed the model name instead).
 */
export function normalizeEngine(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (text === ELECTRIC_ENGINE) {
    return ELECTRIC_ENGINE;
  }

  const litres = LITRES_PATTERN.exec(text);
  const cubicCentimetres = litres ? null : CUBIC_CENTIMETRES_PATTERN.exec(text);
  const displacement = litres
    ? Number(`${litres[1]}.${litres[2]}`)
    : cubicCentimetres
      ? Math.round(Number(cubicCentimetres[1]) / 100) / 10
      : null;

  if (
    displacement === null ||
    displacement < MIN_ENGINE_LITRES ||
    displacement > MAX_ENGINE_LITRES
  ) {
    return null;
  }
  return displacement.toFixed(1);
}
