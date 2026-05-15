import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi, type Comment } from '@/api/comments';
import { useAuth } from '@/auth/AuthContext';
import { ErrorList } from '@/components/ErrorList';
import { isApiError } from '@/api/client';

export function Comments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  const listQuery = useQuery({
    queryKey: ['comments', slug],
    queryFn: () => commentsApi.list(slug),
    enabled: slug.length > 0,
  });

  const createMut = useMutation({
    mutationFn: () => commentsApi.create(slug, body),
    onSuccess: () => {
      setBody('');
      setErrors(null);
      queryClient.invalidateQueries({ queryKey: ['comments', slug] });
    },
    onError: (e) => setErrors(isApiError(e) ? e.errors : { server: ['unknown error'] }),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => commentsApi.remove(slug, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', slug] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    createMut.mutate();
  }

  return (
    <section className="mx-auto max-w-2xl">
      {user ? (
        <form onSubmit={onSubmit} className="mb-md rounded border border-muted bg-white">
          <textarea
            rows={3}
            placeholder="Write a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-t border-b border-muted px-md py-md"
          />
          <ErrorList errors={errors} />
          <div className="flex items-center justify-between bg-bg px-md py-sm">
            {user.image ? (
              <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <span className="inline-block h-8 w-8 rounded-full bg-muted" />
            )}
            <button
              type="submit"
              disabled={createMut.isPending || !body.trim()}
              className="rounded bg-primary px-md py-xs text-sm text-white disabled:opacity-50"
            >
              {createMut.isPending ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-md text-muted">
          <Link to="/login" className="text-info">Sign in</Link> or{' '}
          <Link to="/register" className="text-info">sign up</Link> to add comments on this article.
        </p>
      )}
      <ul className="space-y-md">
        {listQuery.isLoading && <li className="text-muted">Loading comments…</li>}
        {listQuery.data?.comments.map((c: Comment) => (
          <li key={c.id} className="rounded border border-muted bg-white">
            <div className="border-b border-muted px-md py-md">{c.body}</div>
            <div className="flex items-center justify-between bg-bg px-md py-xs text-xs text-muted">
              <Link
                to={`/profile/${c.author.username}`}
                className="flex items-center gap-xs text-info"
              >
                {c.author.image ? (
                  <img src={c.author.image} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <span className="inline-block h-6 w-6 rounded-full bg-muted" />
                )}
                {c.author.username}
              </Link>
              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              {user?.username === c.author.username && (
                <button
                  aria-label="delete comment"
                  onClick={() => removeMut.mutate(c.id)}
                  className="text-danger hover:underline"
                >
                  🗑
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
