import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogType } from '../enums/activity-log-type.enum';
import { ActivityLogResponseDto } from './activity-log-response.dto';

describe('ActivityLogResponseDto', () => {
  const activityLog = {
    id: 'log-1',
    userId: 'user-1',
    type: ActivityLogType.VEHICLE_FAVORITE,
    resourceId: 'vm-1',
    metadata: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as ActivityLog;

  it('maps the activity log fields', () => {
    const dto = new ActivityLogResponseDto(activityLog);

    expect(dto).toMatchObject({
      id: 'log-1',
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId: 'vm-1',
      createdAt: activityLog.createdAt,
    });
  });
});
