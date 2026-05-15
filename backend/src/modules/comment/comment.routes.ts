import { Router } from 'express';
import { prisma } from '../../db/client.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { CreateCommentSchema } from './comment.schemas.js';
import { makeCommentService, type CommentService } from './comment.service.js';

export function makeCommentRouter(
  service: CommentService = makeCommentService(prisma),
): Router {
  const r = Router();

  r.get('/articles/:slug/comments', optionalAuth, async (req, res, next) => {
    try {
      const result = await service.list(req.params['slug']!, req.user?.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.post('/articles/:slug/comments', requireAuth, async (req, res, next) => {
    try {
      const parsed = CreateCommentSchema.parse(req.body);
      const result = await service.create(req.params['slug']!, req.user!.sub, parsed.comment);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/articles/:slug/comments/:id', requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params['id']);
      if (!Number.isFinite(id)) {
        res.status(404).json({ errors: { comment: ['not found'] } });
        return;
      }
      await service.delete(req.params['slug']!, id, req.user!.sub);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
