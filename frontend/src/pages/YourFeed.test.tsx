import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';
import { AuthProvider } from '@/auth/AuthContext';

function setup(feedArticles: object[], globalArticles: object[]) {
  window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
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
    if (url.includes('/api/articles/feed')) {
      return new Response(
        JSON.stringify({ articles: feedArticles, articlesCount: feedArticles.length }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/articles')) {
      return new Response(
        JSON.stringify({ articles: globalArticles, articlesCount: globalArticles.length }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/api/tags')) {
      return new Response(JSON.stringify({ tags: [] }), {
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

const ART = (slug: string, title: string) => ({
  slug,
  title,
  description: 'd',
  body: 'b',
  tagList: [],
  createdAt: '2026-05-15T00:00:00Z',
  updatedAt: '2026-05-15T00:00:00Z',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'alex', bio: null, image: null, following: true },
});

describe('Your Feed end-to-end UI', () => {
  it('defaults to Your Feed when authenticated and shows feed articles', async () => {
    setup([ART('feed-one', 'Feed One')], [ART('global-one', 'Global One')]);
    await waitFor(() => {
      expect(screen.getByText('Feed One')).toBeInTheDocument();
    });
    expect(screen.queryByText('Global One')).not.toBeInTheDocument();
  });

  it('switching to Global Feed shows global articles', async () => {
    setup([], [ART('global-one', 'Global One')]);
    await waitFor(() => {
      expect(screen.getByText(/No articles are here.../i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Global Feed'));
    await waitFor(() => {
      expect(screen.getByText('Global One')).toBeInTheDocument();
    });
  });

  it('shows empty state CTA when Your Feed is empty', async () => {
    setup([], [ART('global-one', 'Global One')]);
    await waitFor(() => {
      expect(screen.getByText(/follow some users/i)).toBeInTheDocument();
    });
  });
});
