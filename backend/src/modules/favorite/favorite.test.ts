import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { makeFavoriteRouter } from './favorite.routes.js';
import { makeFavoriteService } from './favorite.service.js';
import { errorMapper } from '../../errors/mapper.js';
import { signToken } from '../auth/jwt.js';

function makeStub() {
  // Single article + favorites/follows in-memory
  const article = {
    id: 1,
    slug: 'hello',
    title: 'Hello',
    description: 'd',
    body: 'b',
    favoritesCount: 0,
    createdAt: new Date('2026-05-15T00:00:00Z'),
    updatedAt: new Date('2026-05-15T00:00:00Z'),
    authorId: 100,
    author: { id: 100, username: 'alex', bio: null, image: null },
    tags: [],
  };
  const favorites = new Set<string>();
  return {
    article: {
      async findUnique({ where, include }: { where: { slug?: string; id?: number }; include?: unknown }) {
        if (where.slug === article.slug || where.id === article.id) {
          return include ? article : { ...article, author: undefined, tags: undefined };
        }
        return null;
      },
      update: async ({ where, data }: { where: { id: number }; data: { favoritesCount: { increment?: number; decrement?: number } } }) => {
        if (where.id !== article.id) throw new Error('not found');
        const inc = data.favoritesCount?.increment ?? 0;
        const dec = data.favoritesCount?.decrement ?? 0;
        article.favoritesCount = article.favoritesCount + inc - dec;
        return article;
      },
    },
    favorite: {
      async findUnique({ where }: { where: { userId_articleId: { userId: number; articleId: number } } }) {
        const k = `${where.userId_articleId.userId}_${where.userId_articleId.articleId}`;
        return favorites.has(k) ? where.userId_articleId : null;
      },
      create: async ({ data }: { data: { userId: number; articleId: number } }) => {
        favorites.add(`${data.userId}_${data.articleId}`);
        return data;
      },
      delete: async ({ where }: { where: { userId_articleId: { userId: number; articleId: number } } }) => {
        favorites.delete(`${where.userId_articleId.userId}_${where.userId_articleId.articleId}`);
        return where.userId_articleId;
      },
    },
    follow: {
      async findUnique() {
        return null;
      },
    },
    async $transaction<T>(ops: Promise<T>[]) {
      return Promise.all(ops);
    },
  };
}

describe('favorite routes', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stub: any;
  let app: express.Express;
  const token = signToken({ sub: 50, username: 'bob' });

  beforeEach(() => {
    stub = makeStub();
    app = express();
    app.use(express.json());
    app.use('/api', makeFavoriteRouter(makeFavoriteService(stub)));
    app.use(errorMapper);
  });

  it('POST /favorite → 200 + favorited:true, count +1 (Happy)', async () => {
    const res = await request(app)
      .post('/api/articles/hello/favorite')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('POST is idempotent (Happy edge)', async () => {
    await request(app).post('/api/articles/hello/favorite').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .post('/api/articles/hello/favorite')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('DELETE /favorite → favorited:false, count -1 (Happy)', async () => {
    await request(app).post('/api/articles/hello/favorite').set('Authorization', `Token ${token}`);
    const res = await request(app)
      .delete('/api/articles/hello/favorite')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('POST without auth → 401 (Failure)', async () => {
    const res = await request(app).post('/api/articles/hello/favorite');
    expect(res.status).toBe(401);
  });

  it('POST 404 on unknown slug (Failure)', async () => {
    const res = await request(app)
      .post('/api/articles/nope/favorite')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(404);
  });
});
