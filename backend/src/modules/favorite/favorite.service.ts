import type { PrismaClient } from '@prisma/client';
import { Errors } from '../../errors/AppError.js';

type FavoritePrisma = Pick<PrismaClient, 'article' | 'favorite' | 'follow' | '$transaction'>;

interface ArticleWithRelations {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: { id: number; username: string; bio: string | null; image: string | null };
  tags: { tag: { name: string } }[];
}

function serialize(a: ArticleWithRelations, favorited: boolean, following: boolean) {
  return {
    article: {
      slug: a.slug,
      title: a.title,
      description: a.description,
      body: a.body,
      tagList: a.tags.map((t) => t.tag.name).sort(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      favorited,
      favoritesCount: a.favoritesCount,
      author: {
        username: a.author.username,
        bio: a.author.bio,
        image: a.author.image,
        following,
      },
    },
  };
}

export function makeFavoriteService(prisma: FavoritePrisma) {
  async function reload(slug: string, viewerId: number): Promise<ArticleWithRelations> {
    const a = (await prisma.article.findUnique({
      where: { slug },
      include: { author: true, tags: { include: { tag: true } } },
    })) as unknown as ArticleWithRelations | null;
    if (!a) throw Errors.notFound('article');
    return a;
  }

  async function viewerFollowing(viewerId: number, authorId: number): Promise<boolean> {
    if (viewerId === authorId) return false;
    const row = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: authorId } },
    });
    return row !== null;
  }

  return {
    async favorite(slug: string, viewerId: number) {
      const article = await reload(slug, viewerId);
      const existing = await prisma.favorite.findUnique({
        where: { userId_articleId: { userId: viewerId, articleId: article.id } },
      });
      if (!existing) {
        await prisma.$transaction([
          prisma.favorite.create({ data: { userId: viewerId, articleId: article.id } }),
          prisma.article.update({
            where: { id: article.id },
            data: { favoritesCount: { increment: 1 } },
          }),
        ]);
      }
      const updated = await reload(slug, viewerId);
      const following = await viewerFollowing(viewerId, updated.author.id);
      return serialize(updated, true, following);
    },

    async unfavorite(slug: string, viewerId: number) {
      const article = await reload(slug, viewerId);
      const existing = await prisma.favorite.findUnique({
        where: { userId_articleId: { userId: viewerId, articleId: article.id } },
      });
      if (existing) {
        await prisma.$transaction([
          prisma.favorite.delete({
            where: { userId_articleId: { userId: viewerId, articleId: article.id } },
          }),
          prisma.article.update({
            where: { id: article.id },
            data: { favoritesCount: { decrement: 1 } },
          }),
        ]);
      }
      const updated = await reload(slug, viewerId);
      const following = await viewerFollowing(viewerId, updated.author.id);
      return serialize(updated, false, following);
    },
  };
}

export type FavoriteService = ReturnType<typeof makeFavoriteService>;
