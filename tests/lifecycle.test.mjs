import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { AsyncBarrier } from '../dist/esm/index.js';

test('all signal listeners are removed on success and reset', async () => {
  const barrier = new AsyncBarrier(2);
  const controller = new AbortController();
  const a = barrier.wait(controller.signal);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 1);
  await barrier.wait();
  await a;
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  const b = barrier.wait(controller.signal);
  barrier.reset('new');
  await assert.rejects(b, (error) => error.cause === 'new');
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  assert.equal(barrier.waiting, 0);
});

test('explicit undefined break reason remains a broken generation', async () => {
  const barrier = new AsyncBarrier(2);
  const a = barrier.wait();
  barrier.break(undefined);
  await assert.rejects(a, (error) => error.cause === undefined && error.generation === 0);
  assert.equal(barrier.broken, true);
  barrier.reset();
  assert.equal(barrier.generation, 1);
  const b = barrier.wait();
  await barrier.wait();
  assert.equal((await b).generation, 1);
});
