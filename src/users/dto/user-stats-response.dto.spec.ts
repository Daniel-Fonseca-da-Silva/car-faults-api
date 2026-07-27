import { UserStats } from '../user-stats.service';
import { UserStatsResponseDto } from './user-stats-response.dto';

describe('UserStatsResponseDto', () => {
  const stats: UserStats = {
    searchesCount: 4,
    defectsConsultedCount: 2,
    savedVehiclesCount: 3,
    votesCount: 5,
    dislikesCount: 1,
    favoritedVehiclesCount: 2,
  };

  it('maps all six stat counters', () => {
    const dto = new UserStatsResponseDto(stats);

    expect(dto).toEqual(stats);
  });
});
