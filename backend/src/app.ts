import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'conduit', env: process.env.NODE_ENV ?? 'development' });
  });

  // Future routes mounted by subsequent issues:
  //   #2 /api/users, /api/user
  //   #4 /api/profiles
  //   #7 /api/articles, /api/tags
  //   #13 /api/articles/:slug/comments
  //   #15 /api/articles/:slug/favorite
  //   #17 /api/articles/feed

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ errors: { resource: ['not found'] } });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[error]', err.message);
    res.status(500).json({ errors: { server: ['internal error'] } });
  });

  return app;
}
