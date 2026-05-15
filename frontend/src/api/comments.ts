import { apiFetch } from './client';

export interface CommentAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface Comment {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export const commentsApi = {
  list: (slug: string) =>
    apiFetch<{ comments: Comment[] }>(`/api/articles/${encodeURIComponent(slug)}/comments`),
  create: (slug: string, body: string) =>
    apiFetch<{ comment: Comment }>(`/api/articles/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment: { body } }),
    }),
  remove: (slug: string, id: number) =>
    apiFetch<void>(`/api/articles/${encodeURIComponent(slug)}/comments/${id}`, {
      method: 'DELETE',
    }),
};
