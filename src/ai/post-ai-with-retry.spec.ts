import { postAiWithRetry } from './post-ai-with-retry';

describe('postAiWithRetry', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  let sleep: jest.Mock;

  const url = 'https://ai.example.com/lookup';
  const init: RequestInit = { method: 'POST', body: '{}' };

  const response = (status: number) =>
    ({ ok: status < 300, status }) as Response;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    sleep = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const timesFor = (...timestamps: number[]) => {
    const now = jest.fn();
    for (const timestamp of timestamps) {
      now.mockImplementationOnce(() => timestamp);
    }
    return now;
  };

  it('returns the response immediately on first-attempt success', async () => {
    fetchSpy.mockResolvedValue(response(200));

    const result = await postAiWithRetry(url, init, { sleep });

    expect(result.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries once on a fast 503 and returns the successful retry', async () => {
    fetchSpy
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));
    const now = timesFor(0, 100, 100, 200);

    const result = await postAiWithRetry(url, init, { sleep, now });

    expect(result.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it.each([429, 502, 503, 504])(
    'retries once on a fast %d and returns the retry result',
    async (status) => {
      fetchSpy
        .mockResolvedValueOnce(response(status))
        .mockResolvedValueOnce(response(200));
      const now = timesFor(0, 100, 100, 200);

      const result = await postAiWithRetry(url, init, { sleep, now });

      expect(result.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    },
  );

  it('does not retry a 503 that took longer than the slow-attempt threshold', async () => {
    fetchSpy.mockResolvedValueOnce(response(503));
    const now = timesFor(0, 6000);

    const result = await postAiWithRetry(url, init, { sleep, now });

    expect(result.status).toBe(503);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does not retry a 400', async () => {
    fetchSpy.mockResolvedValueOnce(response(400));
    const now = timesFor(0, 50);

    const result = await postAiWithRetry(url, init, { sleep, now });

    expect(result.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it.each([401, 403, 422])('does not retry a %d', async (status) => {
    fetchSpy.mockResolvedValueOnce(response(status));

    const result = await postAiWithRetry(url, init, { sleep });

    expect(result.status).toBe(status);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries once when fetch rejects and succeeds on the second call', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(response(200));

    const result = await postAiWithRetry(url, init, { sleep });

    expect(result.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it('throws when fetch rejects on both attempts', async () => {
    const error = new Error('network down');
    fetchSpy.mockRejectedValue(error);

    await expect(postAiWithRetry(url, init, { sleep })).rejects.toThrow(error);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not exceed maxAttempts even with repeated retryable statuses', async () => {
    fetchSpy.mockResolvedValue(response(503));

    const result = await postAiWithRetry(url, init, { sleep });

    expect(result.status).toBe(503);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
