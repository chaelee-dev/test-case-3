import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { articlesApi, tagsApi } from '@/api/articles';
import { useAuth } from '@/auth/AuthContext';
import { ArticlePreview } from '@/components/ArticlePreview';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 10;
type Tab = 'feed' | 'global' | 'tag';

export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('global');
  const [tabInitialized, setTabInitialized] = useState(false);

  useEffect(() => {
    if (loading || tabInitialized) return;
    setTab(user ? 'feed' : 'global');
    setTabInitialized(true);
  }, [loading, user, tabInitialized]);
  const [tag, setTag] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() });

  const articlesQuery = useQuery({
    queryKey: ['articles', tab, tag, page],
    queryFn: () => {
      const offset = page * PAGE_SIZE;
      if (tab === 'feed') return articlesApi.feed({ limit: PAGE_SIZE, offset });
      if (tab === 'tag' && tag) return articlesApi.list({ tag, limit: PAGE_SIZE, offset });
      return articlesApi.list({ limit: PAGE_SIZE, offset });
    },
    enabled: tab !== 'feed' || !!user,
  });

  function pickTag(t: string) {
    setTag(t);
    setTab('tag');
    setPage(0);
  }

  function selectTab(next: Tab) {
    setTab(next);
    setPage(0);
    if (next !== 'tag') setTag(null);
  }

  return (
    <main>
      <header className="bg-primary px-lg py-xl text-center text-white shadow">
        <h1 className="font-logo text-5xl drop-shadow">conduit</h1>
        <p className="text-lg">A place to share your knowledge.</p>
      </header>
      <section className="mx-auto grid max-w-container grid-cols-1 gap-lg px-md py-lg md:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-md flex border-b border-muted">
            {user && (
              <button
                onClick={() => selectTab('feed')}
                className={`px-md py-sm ${tab === 'feed' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
              >
                Your Feed
              </button>
            )}
            <button
              onClick={() => selectTab('global')}
              className={`px-md py-sm ${tab === 'global' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
            >
              Global Feed
            </button>
            {tag && (
              <button
                onClick={() => selectTab('tag')}
                className={`px-md py-sm ${tab === 'tag' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
              >
                # {tag}
              </button>
            )}
          </div>
          {articlesQuery.isLoading ? (
            <p className="text-muted">Loading articles…</p>
          ) : articlesQuery.isError ? (
            <p className="text-danger">Couldn’t load articles.</p>
          ) : articlesQuery.data && articlesQuery.data.articles.length === 0 ? (
            <p className="text-muted">
              {tab === 'feed'
                ? 'No articles are here... follow some users to get started.'
                : 'No articles are here yet. Be the first to publish!'}
            </p>
          ) : (
            <>
              {articlesQuery.data?.articles.map((a) => (
                <ArticlePreview key={a.slug} article={a} />
              ))}
              {articlesQuery.data && (
                <Pagination
                  total={articlesQuery.data.articlesCount}
                  pageSize={PAGE_SIZE}
                  current={page}
                  onChange={setPage}
                />
              )}
            </>
          )}
        </div>
        <aside className="rounded bg-bg p-md">
          <h3 className="mb-sm font-semibold">Popular Tags</h3>
          {tagsQuery.isLoading && <p className="text-muted">Loading…</p>}
          {tagsQuery.isError && <p className="text-danger">Couldn’t load tags.</p>}
          <ul className="flex flex-wrap gap-xs">
            {tagsQuery.data?.tags.map((t) => (
              <li key={t}>
                <button
                  onClick={() => pickTag(t)}
                  className="rounded-full bg-secondary px-sm py-xs text-xs text-white hover:bg-primary"
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
