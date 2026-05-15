import { describe, it, expect } from 'vitest';
import { slugify, generateUniqueSlug } from './slug.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });
  it('collapses consecutive non-alphanum', () => {
    expect(slugify('   Multi   Space   ---  ')).toBe('multi-space');
  });
  it('strips non-ascii (Korean) into hyphens', () => {
    expect(slugify('안녕 hello')).toBe('hello');
  });
  it('falls back to "article" for empty', () => {
    expect(slugify('   ')).toBe('article');
    expect(slugify('!!!')).toBe('article');
  });
  it('truncates to 80 chars', () => {
    const long = 'a'.repeat(200);
    expect(slugify(long).length).toBe(80);
  });
});

describe('generateUniqueSlug', () => {
  it('returns base when no collision', async () => {
    const slug = await generateUniqueSlug('Hello World', async () => false);
    expect(slug).toBe('hello-world');
  });
  it('returns -2 on first collision', async () => {
    const taken = new Set(['hello-world']);
    const slug = await generateUniqueSlug('Hello World', async (s) => taken.has(s));
    expect(slug).toBe('hello-world-2');
  });
  it('returns -3 on second collision', async () => {
    const taken = new Set(['hello-world', 'hello-world-2']);
    const slug = await generateUniqueSlug('Hello World', async (s) => taken.has(s));
    expect(slug).toBe('hello-world-3');
  });
});
