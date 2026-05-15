import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
  // mock fetch — by default no token so AuthProvider doesn't call /api/user
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify({ errors: { server: ['unmocked'] } }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    }),
  );
});

describe('App scaffold', () => {
  it('renders the conduit banner on /', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('conduit').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/A place to share your knowledge/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    });
  });

  it('renders Sign in form on /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders Sign up form on /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('shows 404 placeholder on unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/404 \(placeholder\)/i)).toBeInTheDocument();
  });
});
