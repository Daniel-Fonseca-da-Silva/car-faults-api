import { BadRequestException } from '@nestjs/common';

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor<T extends Record<string, unknown>>(
  cursor: string,
): T {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Cursor payload must be an object');
    }
    return payload as T;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
