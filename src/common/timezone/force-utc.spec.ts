describe('force-utc', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('pins the process time zone to UTC', async () => {
    process.env.TZ = 'Europe/Lisbon';

    await import('./force-utc');

    // Jest sandboxes process.env, so only the assignment is observable here.
    expect(process.env.TZ).toBe('UTC');
  });
});
