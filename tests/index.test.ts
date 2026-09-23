import { createExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { expect, it, describe, vi, beforeEach } from 'vitest';

import { deleteOldCache } from '~/crons/deleteOldCache';
import { Env, workerHandler } from '~/index';
import { app } from '~/routes';

vi.mock('~/crons/deleteOldCache', async (importActual) => {
  const actual = await importActual<typeof import('~/crons/deleteOldCache')>();
  return {
    ...actual,
    deleteOldCache: vi.fn<typeof actual.deleteOldCache>(),
  };
});
const deleteOldCacheMock = vi.mocked(deleteOldCache);

describe('remote-cache worker', () => {
  let workerEnv: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    workerEnv = env;
    ctx = createExecutionContext();
  });

  it('should respond to the authenticated ping route via invoking the worker handler', async () => {
    const response = await workerHandler.fetch(
      new Request('https://turborepo-remote-cache.com/ping', {
        headers: { Authorization: `Bearer ${workerEnv.TURBO_TOKEN}` },
      }),
      workerEnv,
      ctx,
    );
    expect(response).toBeTruthy();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('pong');
  });

  it('should respond to the authenticated ping route via invoking the app', async () => {
    const request = new Request('http://localhost/ping', {
      headers: { Authorization: `Bearer ${workerEnv.TURBO_TOKEN}` },
    });
    const res = await app.fetch(request, workerEnv, ctx);
    expect(await res.text()).toBe('pong');
  });

  it('should return an empty 404 for the ping route without an auth token', async () => {
    const request = new Request('http://localhost/ping');
    const res = await app.fetch(request, workerEnv, ctx);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('should return an empty 404 for the root route', async () => {
    const res = await app.fetch(new Request('http://localhost/'), workerEnv, ctx);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('should not expose a throw-exception route', async () => {
    const request = new Request('http://localhost/throw-exception');
    const res = await app.fetch(request, workerEnv, ctx);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('should answer a known route without auth exactly as it answers an unknown route', async () => {
    const [known, unknown] = await Promise.all([
      app.fetch(new Request('http://localhost/v8/artifacts/status'), workerEnv, ctx),
      app.fetch(new Request('http://localhost/wpDqNn2G'), workerEnv, ctx),
    ]);
    expect(known.status).toBe(unknown.status);
    expect(await known.text()).toBe(await unknown.text());
    expect([...known.headers]).toEqual([...unknown.headers]);
  });

  it('should throw a 500 error when the storage manager is not configured correctly', async () => {
    const badEnv = { ...workerEnv, R2_STORE: undefined, KV_STORE: undefined };
    const res = await workerHandler.fetch(new Request('http://localhost/ping'), badEnv, ctx);
    expect(res.status).toBe(500);
    expect((await res.text()).includes('Storage options not configured correctly')).toBe(true);
  });
});

describe('remote-cache scheduled event', () => {
  let workerEnv: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    workerEnv = env;
    ctx = createExecutionContext();
  });

  it('should call deleteOldCache', async () => {
    // @ts-expect-error - missing properties for the scheduled event
    await workerHandler.scheduled({ scheduledTime: Date.now() }, workerEnv, ctx);
    expect(deleteOldCacheMock).toHaveBeenCalled();
  });
});
