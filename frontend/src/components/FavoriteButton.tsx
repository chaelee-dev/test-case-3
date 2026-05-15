import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { articlesApi, type Article } from '@/api/articles';
import { useAuth } from '@/auth/AuthContext';

export function FavoriteButton({
  article,
  variant = 'compact',
}: {
  article: Article;
  variant?: 'compact' | 'full';
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      article.favorited ? articlesApi.unfavorite(article.slug) : articlesApi.favorite(article.slug),
    onSuccess: (r) => {
      queryClient.setQueryData(['article', article.slug], r);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  function onClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    mut.mutate();
  }

  const label = article.favorited
    ? variant === 'compact'
      ? `♥ ${article.favoritesCount}`
      : `Unfavorite Article (${article.favoritesCount})`
    : variant === 'compact'
      ? `♡ ${article.favoritesCount}`
      : `♡ Favorite Article (${article.favoritesCount})`;

  const className =
    variant === 'compact'
      ? `inline-flex items-center gap-xs rounded border px-sm py-xs text-xs ${
          article.favorited
            ? 'border-primary bg-primary text-white'
            : 'border-primary text-primary hover:bg-primary hover:text-white'
        }`
      : `rounded border px-sm py-xs ${
          article.favorited
            ? 'border-primary bg-primary text-white'
            : 'border-primary text-primary hover:bg-primary hover:text-white'
        }`;

  return (
    <button onClick={onClick} disabled={mut.isPending} className={className} aria-pressed={article.favorited}>
      {label}
    </button>
  );
}
