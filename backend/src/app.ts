import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { makeAuthRouter } from './modules/auth/auth.routes.js';
import { makeProfileRouter } from './modules/profile/profile.routes.js';
import { makeArticleRouter } from './modules/article/article.routes.js';
import { errorMapper } from './errors/mapper.js';
import { Errors } from './errors/AppError.js';

export interface AppOptions {
  authRouter?: express.Router;
  profileRouter?: express.Router;
  articleRouter?: express.Router;
}

export function createApp(opts: AppOptions = {}): express.Express {
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

  app.use('/api', opts.authRouter ?? makeAuthRouter());
  app.use('/api', opts.profileRouter ?? makeProfileRouter());
  app.use('/api', opts.articleRouter ?? makeArticleRouter());

  // Future routes mounted by subsequent issues:
  //   #13 /api/articles/:slug/comments
  //   #15 /api/articles/:slug/favorite
  //   #17 /api/articles/feed

  app.use((_req, _res, next) => {
    next(Errors.notFound('resource'));
  });

  app.use(errorMapper);

  return app;
}
