import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Comments } from './Comments';
import { AuthProvider } from '@/auth/AuthContext';

function setup(opts: { authedAs?: string; comments?: object[] } = {}) {
  if (opts.authedAs) window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.endsWith('/api/user')) {
      return new Response(
        JSON.stringify({
          user: { username: opts.authedAs, email: 'x@x.com', bio: null, image: null, token: 'fake' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/comments')) {
      return new Response(JSON.stringify({ comments: opts.comments ?? [] }), {
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
        <MemoryRouter>
          <Comments slug="hello" />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Comments section', () => {
  it('shows sign-in prompt when anonymous', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
  });

  it('shows comment form when authed', async () => {
    setup({ authedAs: 'alex' });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a comment/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Post Comment/i })).toBeInTheDocument();
    });
  });

  it('renders comments + delete button for own comments', async () => {
    setup({
      authedAs: 'alex',
      comments: [
        {
          id: 1,
          body: 'first!',
          createdAt: '2026-05-15T00:00:00Z',
          updatedAt: '2026-05-15T00:00:00Z',
          author: { username: 'alex', bio: null, image: null, following: false },
        },
        {
          id: 2,
          body: 'second',
          createdAt: '2026-05-15T00:00:00Z',
          updatedAt: '2026-05-15T00:00:00Z',
          author: { username: 'bob', bio: null, image: null, following: false },
        },
      ],
    });
    await waitFor(() => {
      expect(screen.getByText('first!')).toBeInTheDocument();
      expect(screen.getByText('second')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/delete comment/i);
    expect(deleteButtons).toHaveLength(1); // only on own comment
  });
});
