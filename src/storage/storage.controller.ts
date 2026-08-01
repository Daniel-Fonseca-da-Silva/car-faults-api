import { randomUUID } from 'crypto';
import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { UploadCommentImageResponseDto } from './dto/upload-comment-image-response.dto';
import { R2StorageService } from './r2-storage.service';

export const COMMENT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const COMMENT_IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly r2StorageService: R2StorageService) {}

  @Post('comment-images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload an image to attach to a comment' })
  @ApiOkResponse({ type: UploadCommentImageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Invalid file' })
  async uploadCommentImage(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: COMMENT_IMAGE_MAX_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadCommentImageResponseDto> {
    const user = req.user as User;
    const extension = COMMENT_IMAGE_MIME_EXTENSIONS[file.mimetype];
    const key = `comments/${user.id}/${randomUUID()}.${extension}`;
    const url = await this.r2StorageService.upload(
      key,
      file.buffer,
      file.mimetype,
    );
    return { url };
  }
}
