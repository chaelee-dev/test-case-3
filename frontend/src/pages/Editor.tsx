import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/api/articles';
import { useAuth } from '@/auth/AuthContext';
import { ErrorList } from '@/components/ErrorList';
import { isApiError } from '@/api/client';

export default function Editor() {
  const { slug } = useParams<{ slug?: string }>();
  const editing = Boolean(slug);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [busy, setBusy] = useState(false);

  const existing = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.get(slug!),
    enabled: editing && !!slug,
  });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (editing && existing.data) {
      const a = existing.data.article;
      setTitle(a.title);
      setDescription(a.description);
      setBody(a.body);
      setTagList(a.tagList);
    }
  }, [editing, existing.data]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    setTagList((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput('');
  }

  function removeTag(t: string) {
    setTagList((prev) => prev.filter((x) => x !== t));
  }

  function handleTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors(null);
    setBusy(true);
    try {
      if (editing && slug) {
        const r = await articlesApi.update(slug, { title, description, body });
        navigate(`/article/${r.article.slug}`);
      } else {
        const r = await articlesApi.create({ title, description, body, tagList });
        navigate(`/article/${r.article.slug}`);
      }
    } catch (e) {
      setErrors(isApiError(e) ? e.errors : { server: ['unknown error'] });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  if (editing && existing.isError) {
    return (
      <main className="mx-auto max-w-2xl px-md py-xl">
        <h2 className="text-2xl">Article not found</h2>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-md py-xl">
      <h1 className="mb-md text-2xl">{editing ? 'Edit Article' : 'New Article'}</h1>
      <ErrorList errors={errors} />
      <form onSubmit={onSubmit} className="space-y-md">
        <input
          type="text"
          placeholder="Article Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded border border-muted px-md py-md text-xl"
        />
        <input
          type="text"
          placeholder="What's this article about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded border border-muted px-md py-md"
        />
        <textarea
          rows={8}
          placeholder="Write your article (in markdown)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="w-full rounded border border-muted px-md py-md font-mono"
        />
        {!editing && (
          <>
            <input
              type="text"
              placeholder="Enter tags (Enter or comma to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              onBlur={addTag}
              className="w-full rounded border border-muted px-md py-md"
            />
            <div className="flex flex-wrap gap-xs">
              {tagList.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-xs rounded-full bg-secondary px-sm py-xs text-xs text-white"
                >
                  <button
                    type="button"
                    aria-label={`remove ${t}`}
                    onClick={() => removeTag(t)}
                    className="hover:text-danger"
                  >
                    ×
                  </button>
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={busy}
          className="ml-auto block rounded bg-primary px-lg py-md text-white shadow disabled:opacity-50"
        >
          {busy ? 'Publishing…' : 'Publish Article'}
        </button>
      </form>
    </main>
  );
}
