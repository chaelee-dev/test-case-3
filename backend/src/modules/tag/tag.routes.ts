import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../db/client.js';

export function makeTagRouter(p: Pick<PrismaClient, 'tag' | 'articleTag'> = prisma): Router {
  const r = Router();
  r.get('/tags', async (_req, res, next) => {
    try {
      const grouped = await p.articleTag.groupBy({
        by: ['tagId'],
        _count: { tagId: true },
        orderBy: { _count: { tagId: 'desc' } },
        take: 50,
      });
      const tagIds = grouped.map((g) => g.tagId);
      const tags = await p.tag.findMany({ where: { id: { in: tagIds } } });
      const byId = new Map(tags.map((t) => [t.id, t.name]));
      const ordered = tagIds
        .map((id) => byId.get(id))
        .filter((n): n is string => typeof n === 'string');
      res.json({ tags: ordered });
    } catch (e) {
      next(e);
    }
  });
  return r;
}
