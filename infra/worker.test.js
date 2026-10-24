import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';

test('health reports the deployed environment', async () => {
  const response = await worker.fetch(new Request('https://example.com/health'), {
    ENVIRONMENT: 'dev',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    service: 'yogurt', environment: 'dev', status: 'ok',
  });
});

test('unknown paths return 404', async () => {
  const response = await worker.fetch(new Request('https://example.com/missing'), {
    ENVIRONMENT: 'production',
  });
  assert.equal(response.status, 404);
});
