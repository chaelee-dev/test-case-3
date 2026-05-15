import { apiFetch } from './client';

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ProfileResponse {
  profile: Profile;
}

export const profileApi = {
  get: (username: string) => apiFetch<ProfileResponse>(`/api/profiles/${encodeURIComponent(username)}`),
  follow: (username: string) =>
    apiFetch<ProfileResponse>(`/api/profiles/${encodeURIComponent(username)}/follow`, {
      method: 'POST',
    }),
  unfollow: (username: string) =>
    apiFetch<ProfileResponse>(`/api/profiles/${encodeURIComponent(username)}/follow`, {
      method: 'DELETE',
    }),
};
