import { instanceToPlain } from 'class-transformer';
import { AccessTokenResponseDto } from './access-token-response.dto';

describe('AccessTokenResponseDto', () => {
  it('assigns the given partial to its own properties', () => {
    const dto = new AccessTokenResponseDto({ accessToken: 'token-1' });

    expect(dto.accessToken).toBe('token-1');
  });

  it('serializes only the accessToken property', () => {
    const dto = new AccessTokenResponseDto({ accessToken: 'token-1' });

    const plain = instanceToPlain(dto, { excludeExtraneousValues: true });

    expect(plain).toEqual({ accessToken: 'token-1' });
  });
});
