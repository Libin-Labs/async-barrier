import { AsyncBarrier, type BarrierPass } from '@lp-labs/async-barrier';
const b = new AsyncBarrier(2);
const pass: Promise<BarrierPass> = b.wait();
void pass;
// @ts-expect-error numeric parties
new AsyncBarrier('2');
// @ts-expect-error AbortSignal only
b.wait('abort');
