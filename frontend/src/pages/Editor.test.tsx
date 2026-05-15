import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Editor from './Editor';
import { AuthProvider } from '@/auth/AuthContext';

function renderEditor(initialPath: string) {
  // Seed a fake user in localStorage so AuthProvider triggers me() bootstrap
  window.localStorage.setItem('conduit.jwt', 'fake.jwt.token');
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
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/:slug" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Editor page', () => {
  it('renders New Article form fields', async () => {
    renderEditor('/editor');
    expect(await screen.findByPlaceholderText('Article Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's this article about?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your article/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter tags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Article/i })).toBeInTheDocument();
  });

  it('adds tags via Enter key and removes via × button', async () => {
    renderEditor('/editor');
    const tagInput = await screen.findByPlaceholderText(/Enter tags/i);
    fireEvent.change(tagInput, { target: { value: 'AI' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('ai')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove ai/i }));
    expect(screen.queryByText('ai')).not.toBeInTheDocument();
  });
});
