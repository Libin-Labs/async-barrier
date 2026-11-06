import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as library from '../dist/esm/index.js';
const { BarrierBrokenError, AsyncBarrier } = library;

test('fixed parties release same generation', async () => {
  const b = new AsyncBarrier(2);
  const a = b.wait();
  assert.equal(b.waiting, 1);
  const c = b.wait();
  assert.deepEqual(await a, { generation: 0, index: 0 });
  assert.deepEqual(await c, { generation: 0, index: 1 });
  assert.equal(b.generation, 1);
});
test('cyclic generations do not overlap', async () => {
  const b = new AsyncBarrier(1);
  assert.equal((await b.wait()).generation, 0);
  assert.equal((await b.wait()).generation, 1);
  assert.equal(b.waiting, 0);
});
test('abort breaks every waiter with original cause', async () => {
  const b = new AsyncBarrier(3);
  const c = new AbortController();
  const a = b.wait(c.signal);
  const d = b.wait();
  c.abort('lost');
  await assert.rejects(a, (e) => e instanceof BarrierBrokenError && e.cause === 'lost');
  await assert.rejects(d, BarrierBrokenError);
  assert.equal(b.broken, true);
  await assert.rejects(b.wait(), BarrierBrokenError);
});
test('reset rejects old generation and accepts a new one', async () => {
  const b = new AsyncBarrier(2);
  const p = b.wait();
  b.reset(undefined);
  await assert.rejects(p, (e) => e.cause === undefined && e.generation === 0);
  assert.equal(b.broken, false);
  const a = b.wait();
  const c = b.wait();
  assert.equal((await a).generation, 1);
  await c;
});
test('late abort cannot break next generation', async () => {
  const b = new AsyncBarrier(1);
  const c = new AbortController();
  await b.wait(c.signal);
  c.abort();
  assert.equal(b.broken, false);
  assert.equal((await b.wait()).generation, 1);
});
test('preabort and repeated break preserve first reason', async () => {
  const b = new AsyncBarrier(2);
  const c = new AbortController();
  c.abort('first');
  await assert.rejects(b.wait(c.signal), (e) => e.cause === 'first');
  b.break('second');
  await assert.rejects(b.wait(), (e) => e.cause === 'first');
  assert.throws(() => new AsyncBarrier(0), RangeError);
});
