import type { PrismaClient, Article } from '@prisma/client';
import { Errors } from '../../errors/AppError.js';
import { generateUniqueSlug } from './slug.js';
import type {
  CreateArticleInput,
  FeedInput,
  ListArticlesInput,
  UpdateArticleInput,
} from './article.schemas.js';

export interface AuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleView {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorView;
}

interface RawArticle extends Article {
  author: { id: number; username: string; bio: string | null; image: string | null };
  tags: { tag: { name: string } }[];
}

function serialize(
  a: RawArticle,
  viewerId: number | undefined,
  favoritedBy: Set<number>,
  followingAuthors: Set<number>,
): ArticleView {
  return {
    slug: a.slug,
    title: a.title,
    description: a.description,
    body: a.body,
    tagList: a.tags.map((t) => t.tag.name).sort(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    favorited: viewerId !== undefined && favoritedBy.has(a.id),
    favoritesCount: a.favoritesCount,
    author: {
      username: a.author.username,
      bio: a.author.bio,
      image: a.author.image,
      following: viewerId !== undefined && followingAuthors.has(a.author.id),
    },
  };
}

type ArticlePrisma = Pick<PrismaClient, 'article' | 'tag' | 'articleTag' | 'favorite' | 'follow' | 'user'> & {
  $transaction: PrismaClient['$transaction'];
};

export function makeArticleService(prisma: ArticlePrisma) {
  async function loadDecorations(viewerId: number | undefined, articles: RawArticle[]) {
    const favoritedBy = new Set<number>();
    const followingAuthors = new Set<number>();
    if (!viewerId || articles.length === 0) return { favoritedBy, followingAuthors };
    const articleIds = articles.map((a) => a.id);
    const authorIds = Array.from(new Set(articles.map((a) => a.author.id)));
    const favs = await prisma.favorite.findMany({
      where: { userId: viewerId, articleId: { in: articleIds } },
    });
    favs.forEach((f) => favoritedBy.add(f.articleId));
    const follows = await prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: authorIds } },
    });
    follows.forEach((f) => followingAuthors.add(f.followingId));
    return { favoritedBy, followingAuthors };
  }

  function decorateOne(viewerId: number | undefined, a: RawArticle, favorited: boolean, following: boolean): ArticleView {
    return serialize(a, viewerId, new Set(favorited ? [a.id] : []), new Set(following ? [a.author.id] : []));
  }

  async function loadDecoOne(viewerId: number | undefined, a: RawArticle) {
    if (!viewerId) return { favorited: false, following: false };
    const fav = await prisma.favorite.findUnique({
      where: { userId_articleId: { userId: viewerId, articleId: a.id } },
    });
    const follow =
      viewerId === a.author.id
        ? null
        : await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: a.author.id } },
          });
    return { favorited: fav !== null, following: follow !== null };
  }

  return {
    async list(query: ListArticlesInput, viewerId: number | undefined) {
      const where: Record<string, unknown> = {};
      if (query.tag) where['tags'] = { some: { tag: { name: query.tag } } };
      if (query.author) where['author'] = { username: query.author };
      if (query.favorited) where['favorites'] = { some: { user: { username: query.favorited } } };
      const [articles, count] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset,
          include: { author: true, tags: { include: { tag: true } } },
        }),
        prisma.article.count({ where }),
      ]) as [RawArticle[], number];
      const dec = await loadDecorations(viewerId, articles);
      return {
        articles: articles.map((a) => serialize(a, viewerId, dec.favoritedBy, dec.followingAuthors)),
        articlesCount: count,
      };
    },

    async feed(viewerId: number, query: FeedInput) {
      const following = await prisma.follow.findMany({ where: { followerId: viewerId } });
      const followingIds = following.map((f) => f.followingId);
      if (followingIds.length === 0) return { articles: [], articlesCount: 0 };
      const where = { authorId: { in: followingIds } };
      const [articles, count] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset,
          include: { author: true, tags: { include: { tag: true } } },
        }),
        prisma.article.count({ where }),
      ]) as [RawArticle[], number];
      const dec = await loadDecorations(viewerId, articles);
      return {
        articles: articles.map((a) => serialize(a, viewerId, dec.favoritedBy, dec.followingAuthors)),
        articlesCount: count,
      };
    },

    async get(slug: string, viewerId: number | undefined): Promise<{ article: ArticleView }> {
      const a = (await prisma.article.findUnique({
        where: { slug },
        include: { author: true, tags: { include: { tag: true } } },
      })) as RawArticle | null;
      if (!a) throw Errors.notFound('article');
      const deco = await loadDecoOne(viewerId, a);
      return { article: decorateOne(viewerId, a, deco.favorited, deco.following) };
    },

    async create(authorId: number, input: CreateArticleInput): Promise<{ article: ArticleView }> {
      const slug = await generateUniqueSlug(input.title, async (s) =>
        (await prisma.article.findUnique({ where: { slug } })) !== null,
      );
      const tagNames = Array.from(new Set((input.tagList ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)));
      const created = await prisma.$transaction(async (tx) => {
        const article = await tx.article.create({
          data: {
            slug,
            title: input.title,
            description: input.description,
            body: input.body,
            authorId,
          },
        });
        for (const name of tagNames) {
          const tag = await tx.tag.upsert({ where: { name }, create: { name }, update: {} });
          await tx.articleTag.create({ data: { articleId: article.id, tagId: tag.id } });
        }
        return tx.article.findUnique({
          where: { id: article.id },
          include: { author: true, tags: { include: { tag: true } } },
        }) as Promise<RawArticle>;
      });
      return { article: decorateOne(authorId, created, false, false) };
    },

    async update(slug: string, authorId: number, input: UpdateArticleInput): Promise<{ article: ArticleView }> {
      const existing = await prisma.article.findUnique({ where: { slug } });
      if (!existing) throw Errors.notFound('article');
      if (existing.authorId !== authorId) throw Errors.forbidden();
      // slug fixed on update per chore/slug-policy-adr (#12)
      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data['title'] = input.title;
      if (input.description !== undefined) data['description'] = input.description;
      if (input.body !== undefined) data['body'] = input.body;
      await prisma.article.update({ where: { id: existing.id }, data });
      const reloaded = (await prisma.article.findUnique({
        where: { id: existing.id },
        include: { author: true, tags: { include: { tag: true } } },
      })) as RawArticle;
      const deco = await loadDecoOne(authorId, reloaded);
      return { article: decorateOne(authorId, reloaded, deco.favorited, deco.following) };
    },

    async delete(slug: string, authorId: number): Promise<void> {
      const existing = await prisma.article.findUnique({ where: { slug } });
      if (!existing) throw Errors.notFound('article');
      if (existing.authorId !== authorId) throw Errors.forbidden();
      // Cascade defined in Prisma schema — onDelete: Cascade on Comment/Favorite/ArticleTag
      await prisma.article.delete({ where: { id: existing.id } });
    },
  };
}

export type ArticleService = ReturnType<typeof makeArticleService>;
