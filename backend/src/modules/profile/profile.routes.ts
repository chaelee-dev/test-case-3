import { Router } from 'express';
import { prisma } from '../../db/client.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { makeProfileService, type ProfileService } from './profile.service.js';

export function makeProfileRouter(service: ProfileService = makeProfileService(prisma)): Router {
  const r = Router();

  r.get('/profiles/:username', optionalAuth, async (req, res, next) => {
    try {
      const result = await service.get(req.params['username']!, req.user?.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.post('/profiles/:username/follow', requireAuth, async (req, res, next) => {
    try {
      const result = await service.follow(req.params['username']!, req.user!.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/profiles/:username/follow', requireAuth, async (req, res, next) => {
    try {
      const result = await service.unfollow(req.params['username']!, req.user!.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
