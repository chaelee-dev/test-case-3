import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from './Profile';
import { AuthProvider } from '@/auth/AuthContext';

function renderAt(path: string, jsonResponse: object, init: ResponseInit = {}) {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'content-type': 'application/json' },
      ...init,
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/profile/:username/favorites" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Profile page', () => {
  it('renders profile header with Follow button for other users', async () => {
    renderAt('/profile/alice', {
      profile: { username: 'alice', bio: 'hello', image: null, following: false },
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Follow alice/i })).toBeInTheDocument();
    });
  });

  it('shows tabs for My Articles and Favorited Articles', async () => {
    renderAt('/profile/alice', {
      profile: { username: 'alice', bio: null, image: null, following: false },
    });
    await waitFor(() => {
      expect(screen.getByText('My Articles')).toBeInTheDocument();
      expect(screen.getByText('Favorited Articles')).toBeInTheDocument();
    });
  });

  it('shows "Profile not found" on 404', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ errors: { profile: ['not found'] } }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/profile/nobody']}>
            <Routes>
              <Route path="/profile/:username" element={<Profile />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Profile not found/i)).toBeInTheDocument();
    });
  });
});
