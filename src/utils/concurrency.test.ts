import { describe, it, expect, vi } from "vitest";
import { mapWithConcurrency } from "./concurrency";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("mapWithConcurrency", () => {
  it("returns results in input order", async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => value * 10);

    expect(results).toEqual([10, 20, 30, 40]);
  });

  it("passes the index to the task", async () => {
    const results = await mapWithConcurrency(["a", "b"], 2, async (value, index) =>
      `${index}:${value}`
    );

    expect(results).toEqual(["0:a", "1:b"]);
  });

  it("never runs more than `limit` tasks at the same time", async () => {
    const items = [0, 1, 2, 3, 4];
    const gates = items.map(() => deferred<number>());
    let started = 0;
    const task = vi.fn((item: number) => {
      started += 1;
      return gates[item].promise;
    });

    const resultsPromise = mapWithConcurrency(items, 2, task);

    await vi.waitFor(() => expect(started).toBe(2));
    gates[0].resolve(0);
    await vi.waitFor(() => expect(started).toBe(3));
    gates[1].resolve(1);
    await vi.waitFor(() => expect(started).toBe(4));
    gates[2].resolve(2);
    gates[3].resolve(3);
    await vi.waitFor(() => expect(started).toBe(5));
    gates[4].resolve(4);

    expect(await resultsPromise).toEqual([0, 1, 2, 3, 4]);
  });

  it("handles an empty input without spawning workers", async () => {
    const task = vi.fn();

    expect(await mapWithConcurrency([], 5, task)).toEqual([]);
    expect(task).not.toHaveBeenCalled();
  });

  it("rejects with the task's error and leaves no unhandled rejection", async () => {
    const onUnhandled = vi.fn();
    process.on("unhandledRejection", onUnhandled);

    await expect(
      mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
        throw new Error(`boom ${value}`);
      })
    ).rejects.toThrow(/boom/);

    await new Promise((resolve) => setTimeout(resolve, 10));
    process.off("unhandledRejection", onUnhandled);
    expect(onUnhandled).not.toHaveBeenCalled();
  });
});
