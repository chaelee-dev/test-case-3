import { Router } from 'express';
import { prisma } from '../../db/client.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import {
  CreateArticleSchema,
  FeedQuery,
  ListArticlesQuery,
  UpdateArticleSchema,
} from './article.schemas.js';
import { makeArticleService, type ArticleService } from './article.service.js';

export function makeArticleRouter(
  service: ArticleService = makeArticleService(prisma),
): Router {
  const r = Router();

  r.get('/articles/feed', requireAuth, async (req, res, next) => {
    try {
      const q = FeedQuery.parse(req.query);
      const result = await service.feed(req.user!.sub, q);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.get('/articles', optionalAuth, async (req, res, next) => {
    try {
      const q = ListArticlesQuery.parse(req.query);
      const result = await service.list(q, req.user?.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.get('/articles/:slug', optionalAuth, async (req, res, next) => {
    try {
      const result = await service.get(req.params['slug']!, req.user?.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.post('/articles', requireAuth, async (req, res, next) => {
    try {
      const parsed = CreateArticleSchema.parse(req.body);
      const result = await service.create(req.user!.sub, parsed.article);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  r.put('/articles/:slug', requireAuth, async (req, res, next) => {
    try {
      const parsed = UpdateArticleSchema.parse(req.body);
      const result = await service.update(req.params['slug']!, req.user!.sub, parsed.article);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/articles/:slug', requireAuth, async (req, res, next) => {
    try {
      await service.delete(req.params['slug']!, req.user!.sub);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
