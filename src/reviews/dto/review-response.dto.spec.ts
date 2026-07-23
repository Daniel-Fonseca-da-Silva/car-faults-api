import { User } from '../../users/entities/user.entity';
import { Review } from '../entities/review.entity';
import { ReviewResponseDto } from './review-response.dto';

describe('ReviewResponseDto', () => {
  const review = {
    id: 'review-1',
    userId: 'user-1',
    knownIssueId: 'ki-1',
    rating: 4,
    comment: 'Fixed it myself in a weekend.',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  } as Review;

  it('maps the review fields', () => {
    const dto = new ReviewResponseDto(review);

    expect(dto).toMatchObject({
      id: 'review-1',
      userId: 'user-1',
      knownIssueId: 'ki-1',
      rating: 4,
      comment: 'Fixed it myself in a weekend.',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    });
  });

  it('defaults userName/userAvatarUrl to null when the user relation is not loaded', () => {
    const dto = new ReviewResponseDto(review);

    expect(dto.userName).toBeNull();
    expect(dto.userAvatarUrl).toBeNull();
  });

  it('includes userName/userAvatarUrl when the user relation is loaded', () => {
    const withUser = {
      ...review,
      user: {
        name: 'Jane Doe',
        avatarUrl: 'https://example.com/jane.jpg',
      } as User,
    };

    const dto = new ReviewResponseDto(withUser);

    expect(dto.userName).toBe('Jane Doe');
    expect(dto.userAvatarUrl).toBe('https://example.com/jane.jpg');
  });
});
