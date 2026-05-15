import { Link } from 'react-router-dom';
import type { Article } from '@/api/articles';

export function ArticlePreview({ article }: { article: Article }) {
  const date = new Date(article.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <article className="border-b border-muted py-md">
      <div className="mb-sm flex items-center gap-md text-sm text-muted">
        <Link to={`/profile/${article.author.username}`} className="flex items-center gap-xs">
          {article.author.image ? (
            <img src={article.author.image} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <span className="inline-block h-8 w-8 rounded-full bg-muted" />
          )}
          <span className="text-secondary">{article.author.username}</span>
        </Link>
        <span className="text-xs text-muted">{date}</span>
        <span className="ml-auto inline-flex items-center gap-xs text-primary">
          ♥ {article.favoritesCount}
        </span>
      </div>
      <Link to={`/article/${article.slug}`}>
        <h2 className="text-xl font-bold text-secondary">{article.title}</h2>
        <p className="text-muted">{article.description}</p>
      </Link>
      <div className="mt-sm flex flex-wrap gap-xs">
        <span className="text-xs text-muted">Read more...</span>
        <ul className="ml-auto flex flex-wrap gap-xs">
          {article.tagList.map((t) => (
            <li
              key={t}
              className="rounded-full border border-muted px-sm text-xs text-muted"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
