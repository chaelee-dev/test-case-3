import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App scaffold', () => {
  it('renders the conduit banner on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/conduit/i)).toBeInTheDocument();
    expect(screen.getByText(/A place to share your knowledge/i)).toBeInTheDocument();
  });

  it('renders a placeholder for /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Sign in \(placeholder\)/i)).toBeInTheDocument();
  });

  it('renders 404 placeholder for unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/404 \(placeholder\)/i)).toBeInTheDocument();
  });
});
