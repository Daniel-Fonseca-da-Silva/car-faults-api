import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiTranslateInput,
  AiTranslateProvider,
  AiTranslateResult,
} from './ai-translate.provider';

@Injectable()
export class HttpAiTranslateProvider implements AiTranslateProvider {
  constructor(private readonly configService: ConfigService) {}

  async translate(input: AiTranslateInput): Promise<AiTranslateResult> {
    const apiUrl = this.configService.getOrThrow<string>('AI_TRANSLATE_URL');
    const apiKey = this.configService.get<string>('AI_API_KEY');

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(input),
      });
    } catch (error) {
      throw new ServiceUnavailableException('Failed to reach AI provider', {
        cause: error,
      });
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `AI provider responded with status ${response.status}`,
      );
    }

    return (await response.json()) as AiTranslateResult;
  }
}
