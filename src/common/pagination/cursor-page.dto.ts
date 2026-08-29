export abstract class CursorPageDto<T> {
  items: T[];
  nextCursor: string | null;

  protected constructor(items: T[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}
