import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FavoriteButton } from './FavoriteButton';
import { AuthProvider } from '@/auth/AuthContext';
import type { Article } from '@/api/articles';

const baseArticle: Article = {
  slug: 'hello',
  title: 'Hello',
  description: 'd',
  body: 'b',
  tagList: [],
  createdAt: '2026-05-15T00:00:00Z',
  updatedAt: '2026-05-15T00:00:00Z',
  favorited: false,
  favoritesCount: 3,
  author: { username: 'alex', bio: null, image: null, following: false },
};

function setup(article: Article, opts: { authed?: boolean } = {}) {
  if (opts.authed) window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.endsWith('/api/user')) {
      return new Response(
        JSON.stringify({
          user: { username: 'me', email: 'a@b.com', bio: null, image: null, token: 'fake' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter>
          <FavoriteButton article={article} variant="compact" />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('FavoriteButton', () => {
  it('shows ♡ + count for unfavorited', () => {
    setup(baseArticle);
    expect(screen.getByText('♡ 3')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows ♥ + count for favorited', () => {
    setup({ ...baseArticle, favorited: true, favoritesCount: 4 });
    expect(screen.getByText('♥ 4')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
