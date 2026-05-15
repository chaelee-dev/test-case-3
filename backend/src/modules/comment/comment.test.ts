import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { makeCommentRouter } from './comment.routes.js';
import { makeCommentService } from './comment.service.js';
import { errorMapper } from '../../errors/mapper.js';
import { signToken } from '../auth/jwt.js';

interface CommentRow {
  id: number;
  body: string;
  articleId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author?: { id: number; username: string; bio: string | null; image: string | null };
}

function makeStub() {
  const article = { id: 1, slug: 'hello' };
  const comments = new Map<number, CommentRow>();
  let nextId = 1;
  return {
    article: {
      async findUnique({ where }: { where: { slug?: string; id?: number } }) {
        if (where.slug === article.slug || where.id === article.id) return article;
        return null;
      },
    },
    comment: {
      async findMany({ where }: { where: { articleId: number } }) {
        return Array.from(comments.values()).filter((c) => c.articleId === where.articleId);
      },
      async create({ data, include }: { data: { body: string; articleId: number; authorId: number }; include?: unknown }) {
        const id = nextId++;
        const row: CommentRow = {
          id,
          body: data.body,
          articleId: data.articleId,
          authorId: data.authorId,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: data.authorId, username: `user${data.authorId}`, bio: null, image: null },
        };
        comments.set(id, row);
        return include ? row : row;
      },
      async findUnique({ where }: { where: { id: number } }) {
        return comments.get(where.id) ?? null;
      },
      async delete({ where }: { where: { id: number } }) {
        comments.delete(where.id);
        return { id: where.id };
      },
    },
    follow: {
      async findMany() {
        return [];
      },
    },
  };
}

describe('comment routes', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stub: any;
  let app: express.Express;
  const alexToken = signToken({ sub: 10, username: 'alex' });
  const bobToken = signToken({ sub: 20, username: 'bob' });

  beforeEach(() => {
    stub = makeStub();
    app = express();
    app.use(express.json());
    app.use('/api', makeCommentRouter(makeCommentService(stub)));
    app.use(errorMapper);
  });

  it('POST /comments → 201 + comment (Happy)', async () => {
    const res = await request(app)
      .post('/api/articles/hello/comments')
      .set('Authorization', `Token ${alexToken}`)
      .send({ comment: { body: 'first!' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('first!');
    expect(res.body.comment.author.username).toBe('user10');
  });

  it('POST 422 on empty body (Failure)', async () => {
    const res = await request(app)
      .post('/api/articles/hello/comments')
      .set('Authorization', `Token ${alexToken}`)
      .send({ comment: { body: '' } });
    expect(res.status).toBe(422);
  });

  it('POST 401 without token (Failure)', async () => {
    const res = await request(app)
      .post('/api/articles/hello/comments')
      .send({ comment: { body: 'x' } });
    expect(res.status).toBe(401);
  });

  it('GET /comments returns list (Happy)', async () => {
    await request(app)
      .post('/api/articles/hello/comments')
      .set('Authorization', `Token ${alexToken}`)
      .send({ comment: { body: 'one' } });
    const res = await request(app).get('/api/articles/hello/comments');
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
  });

  it('DELETE by author → 204 (Happy)', async () => {
    const c = await request(app)
      .post('/api/articles/hello/comments')
      .set('Authorization', `Token ${alexToken}`)
      .send({ comment: { body: 'mine' } });
    const id = c.body.comment.id;
    const del = await request(app)
      .delete(`/api/articles/hello/comments/${id}`)
      .set('Authorization', `Token ${alexToken}`);
    expect(del.status).toBe(204);
  });

  it('DELETE by non-author → 403 (Failure)', async () => {
    const c = await request(app)
      .post('/api/articles/hello/comments')
      .set('Authorization', `Token ${alexToken}`)
      .send({ comment: { body: 'mine' } });
    const id = c.body.comment.id;
    const del = await request(app)
      .delete(`/api/articles/hello/comments/${id}`)
      .set('Authorization', `Token ${bobToken}`);
    expect(del.status).toBe(403);
  });

  it('DELETE 404 on unknown comment (Failure)', async () => {
    const res = await request(app)
      .delete('/api/articles/hello/comments/9999')
      .set('Authorization', `Token ${alexToken}`);
    expect(res.status).toBe(404);
  });
});
