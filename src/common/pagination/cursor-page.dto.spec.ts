import { CursorPageDto } from './cursor-page.dto';

class TestPageDto extends CursorPageDto<number> {
  constructor(items: number[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}

describe('CursorPageDto', () => {
  it('exposes items and nextCursor', () => {
    const dto = new TestPageDto([1, 2, 3], 'next-cursor');

    expect(dto.items).toEqual([1, 2, 3]);
    expect(dto.nextCursor).toBe('next-cursor');
  });

  it('supports a null nextCursor for the last page', () => {
    const dto = new TestPageDto([1], null);

    expect(dto.nextCursor).toBeNull();
  });
});
