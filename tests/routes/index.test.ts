import { createExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, beforeEach, test, expect } from 'vitest';

import { Env } from '~/index';
import { app } from '~/routes';

describe('Homepage route', () => {
  let workerEnv: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    workerEnv = env;
    ctx = createExecutionContext();
  });

  test('should return an empty 404 that does not identify the software', async () => {
    const request = new Request('http://localhost/', {
      method: 'GET',
    });
    const response = await app.fetch(request, workerEnv, ctx);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
    expect(response.headers.get('content-type')).toBeNull();
  });
});
