/**
 * Sliding-window limiter for outbound calls to an upstream API. Calls beyond the
 * budget wait for a free slot (up to `maxWaitMs`) instead of hammering the provider.
 */
export function createUpstreamLimiter(name: string, maxCalls: number, windowMs: number, maxWaitMs = 15_000) {
  const stamps: number[] = [];
  let chain: Promise<void> = Promise.resolve();

  const acquire = (): Promise<void> => {
    const next = chain.then(async () => {
      const started = Date.now();
      for (;;) {
        const now = Date.now();
        while (stamps.length && now - stamps[0] >= windowMs) stamps.shift();
        if (stamps.length < maxCalls) {
          stamps.push(now);
          return;
        }
        const wait = windowMs - (now - stamps[0]) + 5;
        if (now - started + wait > maxWaitMs) throw new Error(`${name} limiter saturated`);
        await new Promise((r) => setTimeout(r, wait));
      }
    });
    chain = next.catch(() => undefined);
    return next;
  };
  return { acquire };
}
