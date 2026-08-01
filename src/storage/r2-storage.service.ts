import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errorMessage } from '../redis/redis-error.util';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    const accountId = config.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicBaseUrl = config
      .getOrThrow<string>('R2_PUBLIC_BASE_URL')
      .replace(/\/+$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to upload R2 object ${key}: ${errorMessage(err)}`,
      );
      throw new InternalServerErrorException('Failed to upload image');
    }

    return `${this.publicBaseUrl}/${key}`;
  }

  async deleteByPublicUrl(url: string | null | undefined): Promise<void> {
    if (!url) {
      return;
    }

    const prefix = `${this.publicBaseUrl}/`;
    if (!url.startsWith(prefix)) {
      return;
    }

    const key = url.slice(prefix.length);
    if (!key) {
      return;
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to delete R2 object ${key}: ${errorMessage(err)}`,
      );
      throw new InternalServerErrorException('Failed to delete image');
    }
  }
}
