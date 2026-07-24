import { FixSource } from '../enums/fix-source.enum';
import { FixVoteValue } from '../enums/fix-vote-value.enum';
import { FixWithCounts } from '../fixes.repository';
import { FixResponseDto } from './fix-response.dto';

describe('FixResponseDto', () => {
  const fix = {
    id: 'fix-1',
    knownIssueId: 'ki-1',
    userId: 'user-1',
    summary: 'Replace synchros',
    steps: 'Remove gearbox and replace synchro rings.',
    estimatedCostEur: '450.00',
    source: FixSource.USER,
    likes: 12,
    dislikes: 3,
    myVote: FixVoteValue.LIKE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  } as unknown as FixWithCounts;

  it('maps the fix fields including vote counts', () => {
    const dto = new FixResponseDto(fix);

    expect(dto).toMatchObject({
      id: 'fix-1',
      knownIssueId: 'ki-1',
      userId: 'user-1',
      summary: 'Replace synchros',
      steps: fix.steps,
      estimatedCostEur: '450.00',
      source: FixSource.USER,
      likes: 12,
      dislikes: 3,
      myVote: FixVoteValue.LIKE,
      createdAt: fix.createdAt,
      updatedAt: fix.updatedAt,
    });
  });
});
