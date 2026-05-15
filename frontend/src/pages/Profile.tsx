import { NavLink, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { articlesApi } from '@/api/articles';
import { useAuth } from '@/auth/AuthContext';
import { ArticlePreview } from '@/components/ArticlePreview';

function tabClass({ isActive }: { isActive: boolean }) {
  return `border-b-2 px-md py-sm ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'}`;
}

function ProfileArticles({ username, favorites }: { username: string; favorites: boolean }) {
  const query = useQuery({
    queryKey: ['profile-articles', username, favorites],
    queryFn: () =>
      favorites
        ? articlesApi.list({ favorited: username, limit: 20 })
        : articlesApi.list({ author: username, limit: 20 }),
  });
  if (query.isLoading) return <p className="text-muted">Loading…</p>;
  if (query.isError) return <p className="text-danger">Couldn’t load articles.</p>;
  if (!query.data || query.data.articles.length === 0) {
    return <p className="text-muted">No articles here... yet.</p>;
  }
  return (
    <>
      {query.data.articles.map((a) => (
        <ArticlePreview key={a.slug} article={a} />
      ))}
    </>
  );
}

export default function Profile() {
  const { username = '' } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const query = useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileApi.get(username),
    enabled: username.length > 0,
  });

  const followMut = useMutation({
    mutationFn: (next: boolean) => (next ? profileApi.follow(username) : profileApi.unfollow(username)),
    onSuccess: (r) => queryClient.setQueryData(['profile', username], r),
    onError: () => {
      if (!me) navigate('/login');
    },
  });

  if (query.isLoading) {
    return <main className="mx-auto max-w-container px-md py-lg text-muted">Loading profile…</main>;
  }
  if (query.isError) {
    return (
      <main className="mx-auto max-w-container px-md py-lg">
        <h2 className="text-2xl">Profile not found</h2>
        <Link to="/" className="text-info">
          ← Home
        </Link>
      </main>
    );
  }
  const profile = query.data!.profile;
  const isSelf = me?.username === profile.username;
  const onFavoritesTab = location.pathname.endsWith('/favorites');

  return (
    <main>
      <header className="bg-bg py-xl text-center shadow-inner">
        {profile.image ? (
          <img
            src={profile.image}
            alt=""
            className="mx-auto h-24 w-24 rounded-full border-4 border-white shadow"
          />
        ) : (
          <div className="mx-auto h-24 w-24 rounded-full border-4 border-white bg-muted" />
        )}
        <h1 className="mt-md text-3xl">{profile.username}</h1>
        {profile.bio ? <p className="mt-xs text-secondary">{profile.bio}</p> : null}
        <div className="mt-md">
          {isSelf ? (
            <Link
              to="/settings"
              className="rounded border border-secondary px-md py-sm text-secondary hover:bg-secondary hover:text-white"
            >
              ⚙ Edit Profile Settings
            </Link>
          ) : (
            <button
              onClick={() => {
                if (!me) {
                  navigate('/login');
                  return;
                }
                followMut.mutate(!profile.following);
              }}
              disabled={followMut.isPending}
              className={`rounded px-md py-sm ${
                profile.following
                  ? 'bg-secondary text-white'
                  : 'border border-secondary text-secondary hover:bg-secondary hover:text-white'
              }`}
            >
              {profile.following ? `✓ Following ${profile.username}` : `+ Follow ${profile.username}`}
            </button>
          )}
        </div>
      </header>
      <section className="mx-auto max-w-container px-md py-lg">
        <div className="mb-md flex border-b border-muted">
          <NavLink to={`/profile/${profile.username}`} end className={tabClass}>
            My Articles
          </NavLink>
          <NavLink to={`/profile/${profile.username}/favorites`} className={tabClass}>
            Favorited Articles
          </NavLink>
        </div>
        <ProfileArticles username={profile.username} favorites={onFavoritesTab} />
      </section>
    </main>
  );
}
