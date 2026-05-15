import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { makeArticleRouter } from './article.routes.js';
import { errorMapper } from '../../errors/mapper.js';

// minimal service mock — only validates that routes wire up auth/validation correctly
const dummyService = {
  list: async () => ({ articles: [], articlesCount: 0 }),
  feed: async () => ({ articles: [], articlesCount: 0 }),
  get: async () => {
    throw new Error('not stubbed');
  },
  create: async () => ({
    article: {
      slug: 'test',
      title: 'T',
      description: 'D',
      body: 'B',
      tagList: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorited: false,
      favoritesCount: 0,
      author: { username: 'u', bio: null, image: null, following: false },
    },
  }),
  update: async () => {
    throw new Error('not stubbed');
  },
  delete: async () => {},
};

describe('article routes — auth guards + validation', () => {
  const app = express();
  app.use(express.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use('/api', makeArticleRouter(dummyService as any));
  app.use(errorMapper);

  it('GET /api/articles (no auth) → 200 (Happy)', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articles).toEqual([]);
    expect(res.body.articlesCount).toBe(0);
  });

  it('GET /api/articles?limit=200 → 422 (Failure)', async () => {
    const res = await request(app).get('/api/articles?limit=200');
    expect(res.status).toBe(422);
  });

  it('GET /api/articles/feed without token → 401 (Failure)', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });

  it('POST /api/articles without token → 401 (Failure)', async () => {
    const res = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(res.status).toBe(401);
  });

  it('POST /api/articles missing title → 422 (Failure)', async () => {
    // Skip auth via dummy token — service.create won't be called when Zod fails
    // Use jwt module to mint a real token for test
    const { signToken } = await import('../auth/jwt.js');
    const token = signToken({ sub: 1, username: 'u' });
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { description: 'd', body: 'b' } });
    expect(res.status).toBe(422);
  });

  it('PUT /api/articles/:slug without token → 401 (Failure)', async () => {
    const res = await request(app)
      .put('/api/articles/test')
      .send({ article: { title: 't' } });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/articles/:slug without token → 401 (Failure)', async () => {
    const res = await request(app).delete('/api/articles/test');
    expect(res.status).toBe(401);
  });
});
