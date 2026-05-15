import { Router } from 'express';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';
import { makeFavoriteService, type FavoriteService } from './favorite.service.js';

export function makeFavoriteRouter(
  service: FavoriteService = makeFavoriteService(prisma),
): Router {
  const r = Router();

  r.post('/articles/:slug/favorite', requireAuth, async (req, res, next) => {
    try {
      const result = await service.favorite(req.params['slug']!, req.user!.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/articles/:slug/favorite', requireAuth, async (req, res, next) => {
    try {
      const result = await service.unfavorite(req.params['slug']!, req.user!.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
