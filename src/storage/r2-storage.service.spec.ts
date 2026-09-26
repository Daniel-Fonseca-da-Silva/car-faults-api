import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { R2StorageService } from './r2-storage.service';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual =
    jest.requireActual<typeof import('@aws-sdk/client-s3')>(
      '@aws-sdk/client-s3',
    );
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: sendMock,
    })),
  };
});

describe('R2StorageService', () => {
  let service: R2StorageService;
  let config: { getOrThrow: jest.Mock };

  const ENV: Record<string, string> = {
    R2_ACCOUNT_ID: 'account-1',
    R2_BUCKET_NAME: 'bucket-1',
    R2_PUBLIC_BASE_URL: 'https://cdn.example.com',
    R2_ACCESS_KEY_ID: 'access-key',
    R2_SECRET_ACCESS_KEY: 'secret-key',
  };

  beforeEach(async () => {
    sendMock.mockReset();
    config = {
      getOrThrow: jest.fn((key: string) => ENV[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        R2StorageService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(R2StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('puts the object and returns the public url', async () => {
      sendMock.mockResolvedValue({});

      const url = await service.upload(
        'comments/user-1/image.jpg',
        Buffer.from('data'),
        'image/jpeg',
      );

      expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(url).toBe('https://cdn.example.com/comments/user-1/image.jpg');
    });

    it('throws InternalServerErrorException when the put fails', async () => {
      sendMock.mockRejectedValue(new Error('network error'));

      await expect(
        service.upload(
          'comments/user-1/image.jpg',
          Buffer.from('data'),
          'image/jpeg',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('isCommentImageOwnedBy', () => {
    const uuid = '4e6f4a8b-9c0d-4e2f-8a4b-5c6d7e8f9a0b';

    it.each(['jpg', 'png', 'webp'])(
      'accepts an upload-generated .%s key under the user prefix',
      (ext) => {
        expect(
          service.isCommentImageOwnedBy(
            `https://cdn.example.com/comments/user-1/${uuid}.${ext}`,
            'user-1',
          ),
        ).toBe(true);
      },
    );

    it.each([
      ['empty url', ''],
      [
        'another user prefix',
        `https://cdn.example.com/comments/user-2/${uuid}.jpg`,
      ],
      [
        'user id prefix collision',
        `https://cdn.example.com/comments/user-10/${uuid}.jpg`,
      ],
      ['catalog image', `https://cdn.example.com/vehicles/${uuid}.jpg`],
      ['other host', `https://evil.com/comments/user-1/${uuid}.jpg`],
      [
        'path traversal',
        `https://cdn.example.com/comments/user-1/../user-2/${uuid}.jpg`,
      ],
      [
        'encoded traversal',
        `https://cdn.example.com/comments/user-1/..%2Fuser-2%2F${uuid}.jpg`,
      ],
      ['nested path', `https://cdn.example.com/comments/user-1/x/${uuid}.jpg`],
      [
        'query string',
        `https://cdn.example.com/comments/user-1/${uuid}.jpg?x=1`,
      ],
      [
        'non-uuid filename',
        'https://cdn.example.com/comments/user-1/avatar.jpg',
      ],
      [
        'disallowed extension',
        `https://cdn.example.com/comments/user-1/${uuid}.svg`,
      ],
    ])('rejects %s', (_label, url) => {
      expect(service.isCommentImageOwnedBy(url, 'user-1')).toBe(false);
    });

    it('rejects when userId is empty', () => {
      expect(
        service.isCommentImageOwnedBy(
          `https://cdn.example.com/comments//${uuid}.jpg`,
          '',
        ),
      ).toBe(false);
    });
  });

  describe('deleteByPublicUrl', () => {
    it('does nothing when the url is empty', async () => {
      await service.deleteByPublicUrl(null);
      await service.deleteByPublicUrl(undefined);
      await service.deleteByPublicUrl('');

      expect(sendMock).not.toHaveBeenCalled();
    });

    it('does nothing when the url does not match the public base url', async () => {
      await service.deleteByPublicUrl(
        'https://other-host.com/comments/user-1/image.jpg',
      );

      expect(sendMock).not.toHaveBeenCalled();
    });

    it('deletes the object derived from the public url', async () => {
      sendMock.mockResolvedValue({});

      await service.deleteByPublicUrl(
        'https://cdn.example.com/comments/user-1/image.jpg',
      );

      expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('throws InternalServerErrorException when the delete fails', async () => {
      sendMock.mockRejectedValue(new Error('network error'));

      await expect(
        service.deleteByPublicUrl(
          'https://cdn.example.com/comments/user-1/image.jpg',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
