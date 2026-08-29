import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor } from './cursor.util';

describe('cursor.util', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('round-trips a payload through encode and decode', () => {
      const payload = { createdAt: '2026-01-01T00:00:00.000Z', id: 'abc-1' };

      const cursor = encodeCursor(payload);
      const decoded = decodeCursor<typeof payload>(cursor);

      expect(decoded).toEqual(payload);
    });

    it('produces an opaque base64url string', () => {
      const cursor = encodeCursor({ id: 1 });

      expect(cursor).not.toContain('{');
      expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('throws BadRequestException for a malformed base64 cursor', () => {
      expect(() => decodeCursor('not-json-when-decoded')).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the decoded payload is not an object', () => {
      const cursor = Buffer.from('"just a string"', 'utf8').toString(
        'base64url',
      );

      expect(() => decodeCursor(cursor)).toThrow(BadRequestException);
    });

    it('throws BadRequestException when the decoded payload is null', () => {
      const cursor = Buffer.from('null', 'utf8').toString('base64url');

      expect(() => decodeCursor(cursor)).toThrow(BadRequestException);
    });
  });
});
