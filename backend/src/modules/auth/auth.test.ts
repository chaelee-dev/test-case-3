import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { hashPassword, comparePassword } from './password.js';
import { signToken, verifyToken, extractTokenFromHeader } from './jwt.js';
import { makeAuthService } from './auth.service.js';
import { makeAuthRouter } from './auth.routes.js';
import { errorMapper } from '../../errors/mapper.js';

// --- In-memory PrismaClient-like stub for service tests ---
interface UserRow {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function makeStubPrisma() {
  const rows = new Map<number, UserRow>();
  let nextId = 1;
  const findUnique = ({ where }: { where: Partial<Pick<UserRow, 'id' | 'email' | 'username'>> }) => {
    for (const row of rows.values()) {
      if (where.id !== undefined && row.id === where.id) return row;
      if (where.email !== undefined && row.email === where.email) return row;
      if (where.username !== undefined && row.username === where.username) return row;
    }
    return null;
  };
  return {
    user: {
      findUnique: async (args: Parameters<typeof findUnique>[0]) => findUnique(args),
      create: async ({ data }: { data: Omit<UserRow, 'id' | 'createdAt' | 'updatedAt' | 'bio' | 'image'> & Partial<Pick<UserRow, 'bio' | 'image'>> }) => {
        const id = nextId++;
        const row: UserRow = {
          id,
          email: data.email,
          username: data.username,
          passwordHash: data.passwordHash,
          bio: data.bio ?? null,
          image: data.image ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        rows.set(id, row);
        return row;
      },
      update: async ({ where, data }: { where: { id: number }; data: Partial<UserRow> }) => {
        const row = rows.get(where.id);
        if (!row) throw new Error('not found');
        const next: UserRow = { ...row, ...data, updatedAt: new Date() };
        rows.set(where.id, next);
        return next;
      },
    },
    _reset() {
      rows.clear();
      nextId = 1;
    },
  };
}

describe('password util', () => {
  it('hashes and compares correctly', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(await comparePassword('secret123', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('jwt util', () => {
  it('signs and verifies round-trip', () => {
    const token = signToken({ sub: 42, username: 'alice' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe(42);
    expect(payload.username).toBe('alice');
  });

  it('extracts Token header (RealWorld spec)', () => {
    expect(extractTokenFromHeader('Token abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractTokenFromHeader('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractTokenFromHeader(undefined)).toBe(null);
    expect(extractTokenFromHeader('')).toBe(null);
  });

  it('rejects forged token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});

describe('auth router (integration with stub Prisma)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaStub: any;
  let app: express.Express;

  beforeEach(() => {
    prismaStub = makeStubPrisma();
    app = express();
    app.use(express.json());
    app.use('/api', makeAuthRouter(makeAuthService(prismaStub)));
    app.use(errorMapper);
  });

  it('POST /api/users registers + returns token (Happy)', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'alex', email: 'alex@example.com', password: 'password123' } });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alex@example.com');
    expect(res.body.user.username).toBe('alex');
    expect(res.body.user.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/users 422 on duplicate email (Failure)', async () => {
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'a', email: 'a@b.com', password: 'password123' } });
    const dup = await request(app)
      .post('/api/users')
      .send({ user: { username: 'b', email: 'a@b.com', password: 'password123' } });
    expect(dup.status).toBe(422);
    expect(dup.body.errors.email).toContain('has already been taken');
  });

  it('POST /api/users 422 on weak password (Failure)', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: 'short', email: 'short@b.com', password: '123' } });
    expect(res.status).toBe(422);
    expect(res.body.errors['user.password']).toBeDefined();
  });

  it('POST /api/users/login returns token (Happy)', async () => {
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'r', email: 'r@b.com', password: 'password123' } });
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'r@b.com', password: 'password123' } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('POST /api/users/login 422 on wrong password (Failure)', async () => {
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'r', email: 'r@b.com', password: 'password123' } });
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: 'r@b.com', password: 'WRONG' } });
    expect(res.status).toBe(422);
    expect(res.body.errors['email or password']).toContain('is invalid');
  });

  it('GET /api/user returns current user with valid token (Happy)', async () => {
    const reg = await request(app)
      .post('/api/users')
      .send({ user: { username: 'm', email: 'm@b.com', password: 'password123' } });
    const token = reg.body.user.token;
    const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('m@b.com');
  });

  it('GET /api/user 401 without token (Failure)', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  it('PUT /api/user updates bio (Happy)', async () => {
    const reg = await request(app)
      .post('/api/users')
      .send({ user: { username: 'u', email: 'u@b.com', password: 'password123' } });
    const token = reg.body.user.token;
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'hello world' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('hello world');
  });

  it('PUT /api/user 422 on username conflict (Failure)', async () => {
    await request(app)
      .post('/api/users')
      .send({ user: { username: 'taken', email: 'a@x.com', password: 'password123' } });
    const me = await request(app)
      .post('/api/users')
      .send({ user: { username: 'mine', email: 'b@x.com', password: 'password123' } });
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${me.body.user.token}`)
      .send({ user: { username: 'taken' } });
    expect(res.status).toBe(422);
    expect(res.body.errors.username).toContain('has already been taken');
  });
});
