const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_BACKOFF_MS = 1000;
const DEFAULT_SLOW_ATTEMPT_THRESHOLD_MS = 5000;
const DEFAULT_RETRYABLE_STATUSES = [429, 502, 503, 504];

export interface PostAiWithRetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  slowAttemptThresholdMs?: number;
  retryableStatuses?: number[];
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a single HTTP POST to the AI sidecar with a single retry for
 * transient, fast failures (network errors or 429/502/503/504).
 *
 * Does not retry when the failing attempt took longer than
 * `slowAttemptThresholdMs`: a slow failure means the sidecar already ran its
 * own provider chain (Gemini/Groq) against the LLM, and repeating it would
 * duplicate that 47-96s latency in the caller instead of failing fast.
 */
export async function postAiWithRetry(
  url: string,
  init: RequestInit,
  options: PostAiWithRetryOptions = {},
): Promise<Response> {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    backoffMs = DEFAULT_BACKOFF_MS,
    slowAttemptThresholdMs = DEFAULT_SLOW_ATTEMPT_THRESHOLD_MS,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    sleep = defaultSleep,
    now = Date.now,
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLastAttempt = attempt === maxAttempts;
    const startedAt = now();

    try {
      const response = await fetch(url, init);

      const isRetryableStatus = retryableStatuses.includes(response.status);
      const tookTooLong = now() - startedAt > slowAttemptThresholdMs;

      if (!isRetryableStatus || isLastAttempt || tookTooLong) {
        return response;
      }

      await sleep(backoffMs);
    } catch (error) {
      if (isLastAttempt) {
        throw error;
      }

      await sleep(backoffMs);
    }
  }

  /* istanbul ignore next -- unreachable: loop always returns or throws */
  throw new Error('postAiWithRetry: exhausted attempts without a result');
}
