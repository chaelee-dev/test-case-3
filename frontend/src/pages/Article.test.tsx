import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Article from './Article';
import { AuthProvider } from '@/auth/AuthContext';

const fakeArticle = {
  slug: 'hello-world',
  title: 'Hello World',
  description: 'desc',
  body: 'Article body text.',
  tagList: ['ai'],
  createdAt: '2026-05-15T00:00:00Z',
  updatedAt: '2026-05-15T00:00:00Z',
  favorited: false,
  favoritesCount: 5,
  author: { username: 'alex', bio: null, image: null, following: false },
};

function setup(opts: { authedAs?: string; status?: number } = {}) {
  if (opts.authedAs) window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.endsWith('/api/user')) {
      return new Response(
        JSON.stringify({
          user: {
            username: opts.authedAs,
            email: 'x@x.com',
            bio: null,
            image: null,
            token: 'fake.jwt.token',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/articles/hello-world')) {
      if (opts.status === 404) {
        return new Response(JSON.stringify({ errors: { article: ['not found'] } }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ article: fakeArticle }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/article/hello-world']}>
          <Routes>
            <Route path="/article/:slug" element={<Article />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Article page', () => {
  it('renders title, body, tags (Happy)', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByText('Article body text.')).toBeInTheDocument();
      expect(screen.getByText('ai')).toBeInTheDocument();
    });
  });

  it('shows Edit/Delete for author', async () => {
    setup({ authedAs: 'alex' });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Edit Article/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Article/i })).toBeInTheDocument();
    });
  });

  it('shows Follow + Favorite for non-author', async () => {
    setup({ authedAs: 'bob' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Follow alex/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Favorite Article/i })).toBeInTheDocument();
    });
  });

  it('renders 404 fallback on missing slug', async () => {
    setup({ status: 404 });
    await waitFor(() => {
      expect(screen.getByText(/Article not found/i)).toBeInTheDocument();
    });
  });
});
