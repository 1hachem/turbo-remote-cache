import { HTTPException } from 'hono/http-exception';
import { Hono } from 'hono/tiny';

import { Env } from '..';
import { bearerAuthFromEnv } from './auth';
import { internalRouter } from './internal';
import { notFound } from './not-found';
import { v8App } from './v8';

export const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json({ error: err.message }, 500);
});

app.notFound(notFound);

app.get('/ping', bearerAuthFromEnv, (c) => c.text('pong'));

app.route('/v8', v8App);
app.route('/internal', internalRouter);
