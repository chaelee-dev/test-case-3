import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/api/articles';
import { useAuth } from '@/auth/AuthContext';
import { Comments } from '@/components/Comments';
import { FavoriteButton } from '@/components/FavoriteButton';

export default function Article() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const articleQuery = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.get(slug),
    enabled: slug.length > 0,
  });

  const removeMut = useMutation({
    mutationFn: () => articlesApi.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/');
    },
  });

  if (articleQuery.isLoading) {
    return <main className="mx-auto max-w-container px-md py-lg text-muted">Loading…</main>;
  }
  if (articleQuery.isError) {
    return (
      <main className="mx-auto max-w-container px-md py-xl">
        <h2 className="text-2xl">Article not found</h2>
        <Link to="/" className="text-info">← Home</Link>
      </main>
    );
  }
  const article = articleQuery.data!.article;
  const isAuthor = user?.username === article.author.username;
  const date = new Date(article.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  function ActionBar() {
    if (!user) {
      return (
        <div className="text-sm text-muted">
          <Link to="/login" className="text-info">Sign in</Link> to favorite or follow.
        </div>
      );
    }
    if (isAuthor) {
      return (
        <div className="flex gap-sm">
          <Link
            to={`/editor/${article.slug}`}
            className="rounded border border-secondary px-md py-xs text-secondary hover:bg-secondary hover:text-white"
          >
            ✎ Edit Article
          </Link>
          <button
            onClick={() => {
              if (confirm('Delete this article?')) removeMut.mutate();
            }}
            disabled={removeMut.isPending}
            className="rounded border border-danger px-md py-xs text-danger hover:bg-danger hover:text-white disabled:opacity-50"
          >
            🗑 Delete Article
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-sm text-sm">
        <button className="rounded border border-secondary px-sm py-xs text-secondary">
          + Follow {article.author.username}
        </button>
        <FavoriteButton article={article} variant="full" />
      </div>
    );
  }

  return (
    <main>
      <header className="bg-secondary px-lg py-xl text-white shadow">
        <div className="mx-auto max-w-container">
          <h1 className="mb-md text-4xl">{article.title}</h1>
          <div className="flex items-center gap-md">
            <Link to={`/profile/${article.author.username}`} className="flex items-center gap-xs">
              {article.author.image ? (
                <img src={article.author.image} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <span className="inline-block h-8 w-8 rounded-full bg-muted" />
              )}
              <span>{article.author.username}</span>
            </Link>
            <span className="text-sm text-muted">{date}</span>
            <div className="ml-auto"><ActionBar /></div>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-container px-md py-lg">
        <article className="prose max-w-none whitespace-pre-wrap">{article.body}</article>
        <ul className="mt-md flex flex-wrap gap-xs">
          {article.tagList.map((t) => (
            <li key={t} className="rounded-full border border-muted px-sm text-xs text-muted">
              {t}
            </li>
          ))}
        </ul>
        <hr className="my-lg border-muted" />
        <Comments slug={article.slug} />
      </section>
    </main>
  );
}
