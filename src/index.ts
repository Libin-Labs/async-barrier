export interface BarrierPass {
  readonly generation: number;
  readonly index: number;
}
export class BarrierBrokenError extends Error {
  readonly generation: number;
  constructor(generation: number, reason: unknown) {
    super('Barrier generation is broken', { cause: reason });
    this.name = 'BarrierBrokenError';
    this.generation = generation;
  }
}
interface Arrival {
  resolve: (pass: BarrierPass) => void;
  reject: (error: unknown) => void;
  cleanup: () => void;
}
export class AsyncBarrier {
  readonly parties: number;
  private current = 0;
  private arrivals: Arrival[] = [];
  private failure: BarrierBrokenError | undefined;
  constructor(parties: number) {
    if (!Number.isSafeInteger(parties) || parties < 1)
      throw new RangeError('parties must be a positive safe integer');
    this.parties = parties;
  }
  get generation(): number {
    return this.current;
  }
  get waiting(): number {
    return this.arrivals.length;
  }
  get broken(): boolean {
    return this.failure !== undefined;
  }
  break(reason?: unknown): void {
    if (this.failure) return;
    this.failure = new BarrierBrokenError(this.current, reason);
    const arrivals = this.arrivals;
    this.arrivals = [];
    for (const arrival of arrivals) {
      arrival.cleanup();
      arrival.reject(this.failure);
    }
  }
  reset(reason?: unknown): void {
    this.break(reason);
    this.failure = undefined;
    this.current++;
  }
  wait(signal?: AbortSignal): Promise<BarrierPass> {
    if (this.failure) return Promise.reject(this.failure);
    if (signal?.aborted) {
      this.break(signal.reason);
      return Promise.reject(this.failure);
    }
    return new Promise((resolve, reject) => {
      const generation = this.current;
      const abort = () => {
        if (this.current === generation) this.break(signal?.reason);
      };
      this.arrivals.push({
        resolve,
        reject,
        cleanup: () => signal?.removeEventListener('abort', abort),
      });
      signal?.addEventListener('abort', abort, { once: true });
      if (this.arrivals.length === this.parties) {
        const arrivals = this.arrivals;
        this.arrivals = [];
        this.current++;
        arrivals.forEach((arrival, position) => {
          arrival.cleanup();
          arrival.resolve(Object.freeze({ generation, index: position }));
        });
      }
    });
  }
}
