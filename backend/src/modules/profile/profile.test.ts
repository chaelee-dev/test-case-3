import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { makeProfileRouter } from './profile.routes.js';
import { makeProfileService } from './profile.service.js';
import { makeAuthRouter } from '../auth/auth.routes.js';
import { makeAuthService } from '../auth/auth.service.js';
import { errorMapper } from '../../errors/mapper.js';

interface UserRow {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
}
interface FollowKey {
  followerId: number;
  followingId: number;
}

function makeStubPrisma() {
  const users = new Map<number, UserRow>();
  const follows = new Set<string>();
  let nextId = 1;
  const key = (k: FollowKey) => `${k.followerId}_${k.followingId}`;

  return {
    user: {
      async findUnique({ where }: { where: Partial<Pick<UserRow, 'id' | 'email' | 'username'>> }) {
        for (const u of users.values()) {
          if (where.id !== undefined && u.id === where.id) return u;
          if (where.email !== undefined && u.email === where.email) return u;
          if (where.username !== undefined && u.username === where.username) return u;
        }
        return null;
      },
      async create({ data }: { data: Omit<UserRow, 'id' | 'bio' | 'image'> & Partial<Pick<UserRow, 'bio' | 'image'>> }) {
        const u: UserRow = {
          id: nextId++,
          email: data.email,
          username: data.username,
          passwordHash: data.passwordHash,
          bio: data.bio ?? null,
          image: data.image ?? null,
        };
        users.set(u.id, u);
        return u;
      },
      async update({ where, data }: { where: { id: number }; data: Partial<UserRow> }) {
        const u = users.get(where.id);
        if (!u) throw new Error('not found');
        const next = { ...u, ...data };
        users.set(where.id, next);
        return next;
      },
    },
    follow: {
      async findUnique({ where }: { where: { followerId_followingId: FollowKey } }) {
        return follows.has(key(where.followerId_followingId)) ? where.followerId_followingId : null;
      },
      async upsert({ where, create }: { where: { followerId_followingId: FollowKey }; create: FollowKey; update: Record<string, unknown> }) {
        follows.add(key(where.followerId_followingId));
        return create;
      },
      async delete({ where }: { where: { followerId_followingId: FollowKey } }) {
        const k = key(where.followerId_followingId);
        if (!follows.has(k)) throw new Error('not found');
        follows.delete(k);
        return where.followerId_followingId;
      },
    },
  };
}

describe('profile router', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stub: any;
  let app: express.Express;
  let aliceToken: string;
  let bobToken: string;

  beforeEach(async () => {
    stub = makeStubPrisma();
    app = express();
    app.use(express.json());
    app.use('/api', makeAuthRouter(makeAuthService(stub)));
    app.use('/api', makeProfileRouter(makeProfileService(stub)));
    app.use(errorMapper);

    const alice = await request(app)
      .post('/api/users')
      .send({ user: { username: 'alice', email: 'a@x.com', password: 'password123' } });
    aliceToken = alice.body.user.token;
    const bob = await request(app)
      .post('/api/users')
      .send({ user: { username: 'bob', email: 'b@x.com', password: 'password123' } });
    bobToken = bob.body.user.token;
  });

  it('GET /api/profiles/:username (no auth) returns profile (Happy)', async () => {
    const res = await request(app).get('/api/profiles/alice');
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('alice');
    expect(res.body.profile.following).toBe(false);
  });

  it('GET 404 on unknown username (Failure)', async () => {
    const res = await request(app).get('/api/profiles/nobody');
    expect(res.status).toBe(404);
    expect(res.body.errors.profile).toContain('not found');
  });

  it('POST /api/profiles/alice/follow toggles following:true (Happy)', async () => {
    const res = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);

    const view = await request(app)
      .get('/api/profiles/alice')
      .set('Authorization', `Token ${bobToken}`);
    expect(view.body.profile.following).toBe(true);
  });

  it('DELETE /follow toggles back to false (Happy)', async () => {
    await request(app).post('/api/profiles/alice/follow').set('Authorization', `Token ${bobToken}`);
    const res = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('POST self-follow → 422 (Failure)', async () => {
    const res = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${aliceToken}`);
    expect(res.status).toBe(422);
    expect(res.body.errors.follow).toContain('cannot follow yourself');
  });

  it('POST without auth → 401 (Failure)', async () => {
    const res = await request(app).post('/api/profiles/alice/follow');
    expect(res.status).toBe(401);
  });

  it('DELETE on non-existent follow is idempotent (Happy edge)', async () => {
    const res = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});
