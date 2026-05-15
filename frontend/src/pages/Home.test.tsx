import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';
import { AuthProvider } from '@/auth/AuthContext';

function setup(opts: { authed?: boolean; articles?: object[]; tags?: string[]; articlesCount?: number } = {}) {
  if (opts.authed) window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
  const articles = opts.articles ?? [];
  const tags = opts.tags ?? ['ai', 'web'];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.endsWith('/api/user')) {
      return new Response(
        JSON.stringify({
          user: { username: 'alex', email: 'a@b.com', bio: null, image: null, token: 'fake.jwt.token' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/tags')) {
      return new Response(JSON.stringify({ tags }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('/api/articles')) {
      return new Response(
        JSON.stringify({ articles, articlesCount: opts.articlesCount ?? articles.length }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Home page', () => {
  it('renders banner + tabs + popular tags (visitor)', async () => {
    setup();
    expect(screen.getByRole('heading', { name: /conduit/i })).toBeInTheDocument();
    expect(screen.getByText(/A place to share your knowledge/i)).toBeInTheDocument();
    expect(screen.getByText('Global Feed')).toBeInTheDocument();
    expect(screen.queryByText('Your Feed')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Popular Tags')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ai' })).toBeInTheDocument();
    });
  });

  it('shows Your Feed tab for authenticated user', async () => {
    setup({ authed: true });
    await waitFor(() => {
      expect(screen.getByText('Your Feed')).toBeInTheDocument();
    });
  });

  it('renders article previews when API returns articles', async () => {
    setup({
      articles: [
        {
          slug: 'hello',
          title: 'Hello World',
          description: 'desc',
          body: 'b',
          tagList: ['ai'],
          createdAt: '2026-05-15T00:00:00Z',
          updatedAt: '2026-05-15T00:00:00Z',
          favorited: false,
          favoritesCount: 3,
          author: { username: 'alex', bio: null, image: null, following: false },
        },
      ],
    });
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByText('desc')).toBeInTheDocument();
    });
  });
});
