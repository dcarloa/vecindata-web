/**
 * Maps over `items` running at most `limit` tasks at the same time, preserving
 * input order in the returned array.
 *
 * Same worker-pool shape as `runBatch`: a small pool of workers pulling from a
 * shared index, each waiting for its task to settle before claiming the next.
 * Used to keep paid/rate-limited fan-outs (Geocoding) from firing every request
 * at once.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  }

  const workerCount = Math.min(Math.max(1, limit), items.length);
  // allSettled rather than all: with `all`, one worker rejecting would leave the
  // other in-flight workers' rejections unhandled.
  const settled = await Promise.allSettled(
    Array.from({ length: workerCount }, () => worker())
  );
  const failure = settled.find((outcome) => outcome.status === "rejected");
  if (failure) throw (failure as PromiseRejectedResult).reason;

  return results;
}
