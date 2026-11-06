# @lp-labs/async-barrier

Cyclic fixed-party rendezvous with explicit broken generations.

## Install

```sh
npm install @lp-labs/async-barrier
```

Zero runtime, peer, or sibling dependencies. Node 18+; strict TypeScript declarations and independent ESM/CommonJS builds. Version 0.1.0, MIT.

## Quickstart

```js
import { AsyncBarrier } from '@lp-labs/async-barrier';
const barrier = new AsyncBarrier(2);
const passes = await Promise.all([barrier.wait(), barrier.wait()]);
console.log(passes.map((pass) => pass.generation)); // [0, 0]
```

## API and contracts

Each wait is one arrival; callers must ensure one arrival per logical party per generation. The final arrival resolves all with zero-based arrival index and generation, then automatically advances generation. Abort breaks the entire current generation, not merely its ticket. BarrierBrokenError retains cause (including undefined) and generation; break is idempotent and subsequent wait rejects until reset. reset rejects pending old arrivals and advances even an empty/broken generation. Abort after a successful pass cannot affect the next generation. parties is a positive safe integer or RangeError. No worker identity tracking, timeout scheduler, or task execution. O(parties) memory and release work; no timers.

## Full declarations

The complete public declarations below are generated from the package's strict source. All runtime exports, interfaces, options, return types and readonly state are listed here.

<!-- declarations -->

```ts
export interface BarrierPass {
  readonly generation: number;
  readonly index: number;
}
export declare class BarrierBrokenError extends Error {
  readonly generation: number;
  constructor(generation: number, reason: unknown);
}
export declare class AsyncBarrier {
  readonly parties: number;
  private current;
  private arrivals;
  private failure;
  constructor(parties: number);
  get generation(): number;
  get waiting(): number;
  get broken(): boolean;
  break(reason?: unknown): void;
  reset(reason?: unknown): void;
  wait(signal?: AbortSignal): Promise<BarrierPass>;
}
```

<!-- end declarations -->

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

All tests use deterministic clocks, immediate injected sleeps, or explicit promise gates rather than timing guesses. Package exports select ESM for import and CommonJS for require, with separate declaration trees. No runtime configuration files or global hooks.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
