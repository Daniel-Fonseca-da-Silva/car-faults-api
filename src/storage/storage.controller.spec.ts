import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { R2StorageService } from './r2-storage.service';
import { StorageController } from './storage.controller';

describe('StorageController', () => {
  let controller: StorageController;
  let r2StorageService: { upload: jest.Mock };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const buildFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('data'),
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(async () => {
    r2StorageService = { upload: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: R2StorageService, useValue: r2StorageService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadCommentImage', () => {
    it('uploads the file under a per-user key with the right extension', async () => {
      r2StorageService.upload.mockResolvedValue(
        'https://cdn.example.com/comments/user-1/uuid.jpg',
      );

      const result = await controller.uploadCommentImage(req, buildFile());

      expect(r2StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^comments\/user-1\/.+\.jpg$/),
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(result).toEqual({
        url: 'https://cdn.example.com/comments/user-1/uuid.jpg',
      });
    });

    it('derives the extension from a png mimetype', async () => {
      r2StorageService.upload.mockResolvedValue(
        'https://cdn.example.com/comments/user-1/uuid.png',
      );

      await controller.uploadCommentImage(
        req,
        buildFile({ mimetype: 'image/png' }),
      );

      expect(r2StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^comments\/user-1\/.+\.png$/),
        expect.any(Buffer),
        'image/png',
      );
    });
  });

  describe('uploadVehicleImage', () => {
    it('uploads the file under a vehicles/ key with the right extension', async () => {
      r2StorageService.upload.mockResolvedValue(
        'https://cdn.example.com/vehicles/uuid.jpg',
      );

      const result = await controller.uploadVehicleImage(buildFile());

      expect(r2StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^vehicles\/.+\.jpg$/),
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(result).toEqual({
        url: 'https://cdn.example.com/vehicles/uuid.jpg',
      });
    });
  });
});
