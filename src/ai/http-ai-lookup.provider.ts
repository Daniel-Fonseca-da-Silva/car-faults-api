import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiLookupInput,
  AiLookupProvider,
  AiLookupResult,
} from './ai-lookup.provider';

@Injectable()
export class HttpAiLookupProvider implements AiLookupProvider {
  constructor(private readonly configService: ConfigService) {}

  async generateLookup(input: AiLookupInput): Promise<AiLookupResult> {
    const apiUrl = this.configService.getOrThrow<string>('AI_API_URL');
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

    return (await response.json()) as AiLookupResult;
  }
}
