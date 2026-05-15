import { apiFetch } from './client';

export interface Author {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Author;
}

export interface ArticleResponse {
  article: Article;
}

export interface MultipleArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export interface ListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export const articlesApi = {
  list: (q: ListArticlesQuery = {}) => {
    const params = new URLSearchParams();
    if (q.tag) params.set('tag', q.tag);
    if (q.author) params.set('author', q.author);
    if (q.favorited) params.set('favorited', q.favorited);
    if (q.limit !== undefined) params.set('limit', String(q.limit));
    if (q.offset !== undefined) params.set('offset', String(q.offset));
    const qs = params.toString();
    return apiFetch<MultipleArticlesResponse>(`/api/articles${qs ? `?${qs}` : ''}`);
  },
  feed: (q: { limit?: number; offset?: number } = {}) => {
    const params = new URLSearchParams();
    if (q.limit !== undefined) params.set('limit', String(q.limit));
    if (q.offset !== undefined) params.set('offset', String(q.offset));
    const qs = params.toString();
    return apiFetch<MultipleArticlesResponse>(`/api/articles/feed${qs ? `?${qs}` : ''}`);
  },
  get: (slug: string) => apiFetch<ArticleResponse>(`/api/articles/${encodeURIComponent(slug)}`),
  create: (payload: { title: string; description: string; body: string; tagList: string[] }) =>
    apiFetch<ArticleResponse>('/api/articles', {
      method: 'POST',
      body: JSON.stringify({ article: payload }),
    }),
  update: (slug: string, payload: Partial<{ title: string; description: string; body: string }>) =>
    apiFetch<ArticleResponse>(`/api/articles/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify({ article: payload }),
    }),
  remove: (slug: string) =>
    apiFetch<void>(`/api/articles/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  favorite: (slug: string) =>
    apiFetch<ArticleResponse>(`/api/articles/${encodeURIComponent(slug)}/favorite`, {
      method: 'POST',
    }),
  unfavorite: (slug: string) =>
    apiFetch<ArticleResponse>(`/api/articles/${encodeURIComponent(slug)}/favorite`, {
      method: 'DELETE',
    }),
};

export const tagsApi = {
  list: () => apiFetch<{ tags: string[] }>('/api/tags'),
};
