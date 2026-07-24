import { Fix } from '../../fixes/entities/fix.entity';
import { FixSource } from '../../fixes/enums/fix-source.enum';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import {
  FixResponseDto,
  KnownIssueResponseDto,
  LookupResponseDto,
  VehicleResponseDto,
} from './lookup-response.dto';

describe('lookup response DTOs', () => {
  const fix = {
    id: 'fix-1',
    knownIssueId: 'ki-1',
    userId: null,
    summary: 'Replace synchros',
    steps: 'Remove gearbox and replace synchro rings.',
    estimatedCostEur: '450.00',
    source: FixSource.AI,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Fix;

  const knownIssue = {
    id: 'ki-1',
    vehicleModelId: 'vm-1',
    title: 'Problematic gearbox',
    description: 'Synchros wear out prematurely.',
    severity: IssueSeverity.HIGH,
    typicalKm: 120000,
    sources: ['https://example.com'],
    aiGeneratedAt: new Date('2026-01-01'),
    fixes: [fix],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as KnownIssue;

  const vehicleModel = {
    id: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    name: null,
    yearFrom: 2001,
    yearTo: 2001,
    engine: '1.0',
    doors: 3,
    imageUrl: null,
    techSpecs: { power_hp: 50 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as unknown as VehicleModel;

  describe('FixResponseDto', () => {
    it('maps the fix fields', () => {
      const dto = new FixResponseDto(fix);

      expect(dto).toMatchObject({
        id: 'fix-1',
        summary: 'Replace synchros',
        steps: fix.steps,
        estimatedCostEur: '450.00',
        source: FixSource.AI,
      });
    });

    it('defaults likes/dislikes to 0 when not provided', () => {
      const dto = new FixResponseDto(fix);

      expect(dto.likes).toBe(0);
      expect(dto.dislikes).toBe(0);
    });

    it('maps likes/dislikes when provided', () => {
      const dto = new FixResponseDto({ ...fix, likes: 12, dislikes: 3 });

      expect(dto.likes).toBe(12);
      expect(dto.dislikes).toBe(3);
    });
  });

  describe('KnownIssueResponseDto', () => {
    it('maps the known issue fields and nested fixes', () => {
      const dto = new KnownIssueResponseDto(knownIssue);

      expect(dto).toMatchObject({
        id: 'ki-1',
        title: 'Problematic gearbox',
        severity: IssueSeverity.HIGH,
        typicalKm: 120000,
        sources: ['https://example.com'],
      });
      expect(dto.fixes).toHaveLength(1);
      expect(dto.fixes[0]).toBeInstanceOf(FixResponseDto);
    });

    it('defaults fixes to an empty array when not loaded', () => {
      const dto = new KnownIssueResponseDto({
        ...knownIssue,
        fixes: undefined as never,
      });

      expect(dto.fixes).toEqual([]);
    });
  });

  describe('VehicleResponseDto', () => {
    it('maps the vehicle model fields', () => {
      const dto = new VehicleResponseDto(vehicleModel);

      expect(dto).toMatchObject({
        id: 'vm-1',
        brand: 'Volkswagen',
        model: 'Polo',
        yearFrom: 2001,
        yearTo: 2001,
        engine: '1.0',
        doors: 3,
        techSpecs: { power_hp: 50 },
      });
    });
  });

  describe('LookupResponseDto', () => {
    it('combines the vehicle and known issues', () => {
      const dto = new LookupResponseDto(vehicleModel, [knownIssue]);

      expect(dto.vehicle).toBeInstanceOf(VehicleResponseDto);
      expect(dto.knownIssues).toHaveLength(1);
      expect(dto.knownIssues[0]).toBeInstanceOf(KnownIssueResponseDto);
    });
  });
});
