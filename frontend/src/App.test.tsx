import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/tags')) {
      return new Response(JSON.stringify({ tags: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/api/articles')) {
      return new Response(JSON.stringify({ articles: [], articlesCount: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ errors: { server: ['unmocked'] } }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  });
});

describe('App scaffold', () => {
  it('renders the conduit banner on /', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getAllByText('conduit').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/A place to share your knowledge/i)).toBeInTheDocument();
    });
  });

  it('renders Sign in form on /login', () => {
    renderApp('/login');
    expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('renders Sign up form on /register', () => {
    renderApp('/register');
    expect(screen.getByRole('heading', { name: /Sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('shows 404 placeholder on unknown route', () => {
    renderApp('/does-not-exist');
    expect(screen.getByText(/404 \(placeholder\)/i)).toBeInTheDocument();
  });
});
