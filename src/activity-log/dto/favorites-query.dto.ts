import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';

export const FAVORITES_DEFAULT_LIMIT = 20;
export const FAVORITES_MAX_LIMIT = 100;

export class FavoritesQueryDto extends CursorPaginationQueryDto {}
