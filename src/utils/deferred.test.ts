import { Deferred } from './deferred';

describe('Deferred', () => {
  const timeoutMs = 100;
  const cleanup = jest.fn();

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    cleanup.mockClear();
  });

  it('resolves when predicate is satisfied', async () => {
    jest.useFakeTimers();
    const deferred = new Deferred<number>({
      timeoutMs,
      predicate: (v) => v > 5,
      cleanup,
    });
    let resolved = false;
    deferred.promise.then(() => {
      resolved = true;
    });
    deferred.update(3);
    expect(resolved).toBe(false);
    deferred.update(7);
    jest.runAllTimers();
    await Promise.resolve();
    expect(resolved).toBe(true);
    expect(cleanup).toHaveBeenCalled();
  });

  it('resolves on timeout if predicate is never satisfied', async () => {
    jest.useFakeTimers();
    const deferred = new Deferred<number>({
      timeoutMs,
      predicate: () => false,
      cleanup,
    });
    let resolved = false;
    deferred.promise.then(() => {
      resolved = true;
    });
    deferred.update(1);
    deferred.update(2);
    jest.advanceTimersByTime(timeoutMs + 1);
    await Promise.resolve();
    expect(resolved).toBe(true);
    expect(cleanup).toHaveBeenCalled();
  });

  it('does not resolve more than once and cleanup is called once', async () => {
    jest.useFakeTimers();
    const deferred = new Deferred<number>({
      timeoutMs,
      predicate: (v) => v === 1,
      cleanup,
    });
    const onResolve = jest.fn();
    deferred.promise.then(onResolve);
    deferred.update(1);
    deferred.update(2);
    deferred.update(1);
    jest.runAllTimers();
    await Promise.resolve();
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
