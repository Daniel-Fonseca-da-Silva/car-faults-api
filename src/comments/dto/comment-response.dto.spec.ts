import { User } from '../../users/entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { CommentResponseDto } from './comment-response.dto';

describe('CommentResponseDto', () => {
  const comment = {
    id: 'comment-1',
    userId: 'user-1',
    knownIssueId: 'ki-1',
    body: 'Had the same issue at 90k km.',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  } as Comment;

  it('maps the comment fields', () => {
    const dto = new CommentResponseDto(comment);

    expect(dto).toMatchObject({
      id: 'comment-1',
      userId: 'user-1',
      knownIssueId: 'ki-1',
      body: 'Had the same issue at 90k km.',
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  });

  it('defaults userName/userAvatarUrl to null when the user relation is not loaded', () => {
    const dto = new CommentResponseDto(comment);

    expect(dto.userName).toBeNull();
    expect(dto.userAvatarUrl).toBeNull();
  });

  it('includes userName/userAvatarUrl when the user relation is loaded', () => {
    const withUser = {
      ...comment,
      user: {
        name: 'Jane Doe',
        avatarUrl: 'https://example.com/jane.jpg',
      } as User,
    };

    const dto = new CommentResponseDto(withUser);

    expect(dto.userName).toBe('Jane Doe');
    expect(dto.userAvatarUrl).toBe('https://example.com/jane.jpg');
  });
});
