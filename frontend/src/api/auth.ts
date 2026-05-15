import { apiFetch } from './client';

export interface AuthUser {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  token: string;
}

export interface AuthUserResponse {
  user: AuthUser;
}

export const authApi = {
  register: (payload: { username: string; email: string; password: string }) =>
    apiFetch<AuthUserResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ user: payload }),
      auth: false,
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthUserResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ user: payload }),
      auth: false,
    }),
  me: () => apiFetch<AuthUserResponse>('/api/user'),
  update: (payload: Partial<{ email: string; username: string; password: string; bio: string | null; image: string | null }>) =>
    apiFetch<AuthUserResponse>('/api/user', {
      method: 'PUT',
      body: JSON.stringify({ user: payload }),
    }),
};
