import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';

export const errorMapper: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ errors: err.errors });
    return;
  }
  if (err instanceof ZodError) {
    const payload: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'body';
      (payload[key] ??= []).push(issue.message);
    }
    res.status(422).json({ errors: payload });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  res.status(500).json({ errors: { server: ['internal error'] } });
};
