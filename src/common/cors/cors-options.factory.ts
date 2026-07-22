import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(originsCsv: string): CorsOptions {
  const origin = originsCsv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return { origin, credentials: true };
}
