import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { normalizeTag, normalizeTagList } from './tag.js';
import { makeTagRouter } from './tag.routes.js';

describe('tag normalizer', () => {
  it('lowercases + trims', () => {
    expect(normalizeTag('  AI  ')).toBe('ai');
    expect(normalizeTag('JavaScript')).toBe('javascript');
  });
  it('caps to 40 chars', () => {
    const long = 'x'.repeat(60);
    expect(normalizeTag(long).length).toBe(40);
  });
  it('deduplicates list (case-insensitive)', () => {
    expect(normalizeTagList(['AI', 'ai', 'Web', 'web', 'ML'])).toEqual(['ai', 'web', 'ml']);
  });
  it('drops empty/whitespace-only', () => {
    expect(normalizeTagList(['', '  ', 'ok'])).toEqual(['ok']);
  });
});

describe('GET /api/tags', () => {
  it('returns ordered list from groupBy (Happy)', async () => {
    const stub = {
      tag: {
        findMany: async () => [
          { id: 1, name: 'web' },
          { id: 2, name: 'ai' },
          { id: 3, name: 'rust' },
        ],
      },
      articleTag: {
        groupBy: async () => [
          { tagId: 2, _count: { tagId: 10 } },
          { tagId: 1, _count: { tagId: 5 } },
          { tagId: 3, _count: { tagId: 1 } },
        ],
      },
    };
    const app = express();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use('/api', makeTagRouter(stub as any));
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['ai', 'web', 'rust']);
  });

  it('returns empty array on no tags (Happy edge)', async () => {
    const stub = {
      tag: { findMany: async () => [] },
      articleTag: { groupBy: async () => [] },
    };
    const app = express();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use('/api', makeTagRouter(stub as any));
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });
});
