import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { UserVehicle } from '../entities/user-vehicle.entity';
import {
  UserVehicleDetailResponseDto,
  UserVehicleResponseDto,
} from './user-vehicle-response.dto';

describe('user vehicle response DTOs', () => {
  const userVehicle = {
    id: 'uv-1',
    userId: 'user-1',
    vehicleModelId: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    name: 'Meu Polo',
    doors: 3,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as unknown as UserVehicle;

  const knownIssue = {
    id: 'ki-1',
    vehicleModelId: 'vm-1',
    title: 'Problematic gearbox',
    description: 'Synchros wear out prematurely.',
    severity: IssueSeverity.HIGH,
    typicalKm: 120000,
    sources: null,
    aiGeneratedAt: null,
    fixes: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as unknown as KnownIssue;

  describe('UserVehicleResponseDto', () => {
    it('maps the user vehicle fields', () => {
      const dto = new UserVehicleResponseDto(userVehicle);

      expect(dto).toMatchObject({
        id: 'uv-1',
        vehicleModelId: 'vm-1',
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        name: 'Meu Polo',
        doors: 3,
      });
    });
  });

  describe('UserVehicleDetailResponseDto', () => {
    it('extends the base response with known issues', () => {
      const dto = new UserVehicleDetailResponseDto(userVehicle, [knownIssue]);

      expect(dto).toMatchObject({ id: 'uv-1', brand: 'Volkswagen' });
      expect(dto.knownIssues).toHaveLength(1);
      expect(dto.knownIssues[0]).toMatchObject({
        id: 'ki-1',
        title: 'Problematic gearbox',
      });
    });

    it('maps to an empty known issues list when none are given', () => {
      const dto = new UserVehicleDetailResponseDto(userVehicle, []);

      expect(dto.knownIssues).toEqual([]);
    });
  });
});
