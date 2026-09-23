import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'hono/utils/buffer';

import type { Env } from '..';

import { notFound } from './not-found';

const BEARER_PREFIX = /^Bearer\s+/i;

// Answers with 404 rather than 401: a 401 (or a WWW-Authenticate header) confirms
// the route exists, which fingerprints the deployment as a Turborepo cache.
export const bearerAuthFromEnv = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = BEARER_PREFIX.test(header) ? header.replace(BEARER_PREFIX, '') : '';

  if (!(await timingSafeEqual(c.env.TURBO_TOKEN, token))) {
    return notFound();
  }

  return next();
});
