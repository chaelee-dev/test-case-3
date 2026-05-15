import type { PrismaClient, Comment } from '@prisma/client';
import { Errors } from '../../errors/AppError.js';
import type { CreateCommentInput } from './comment.schemas.js';

interface RawComment extends Comment {
  author: { id: number; username: string; bio: string | null; image: string | null };
}

export interface CommentView {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

function serialize(c: RawComment, following: boolean): CommentView {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author: {
      username: c.author.username,
      bio: c.author.bio,
      image: c.author.image,
      following,
    },
  };
}

type CommentPrisma = Pick<PrismaClient, 'comment' | 'article' | 'follow'>;

export function makeCommentService(prisma: CommentPrisma) {
  async function followingMap(viewerId: number | undefined, authorIds: number[]): Promise<Set<number>> {
    if (!viewerId || authorIds.length === 0) return new Set();
    const rows = await prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: authorIds } },
    });
    return new Set(rows.map((r) => r.followingId));
  }

  return {
    async list(slug: string, viewerId: number | undefined): Promise<{ comments: CommentView[] }> {
      const article = await prisma.article.findUnique({ where: { slug } });
      if (!article) throw Errors.notFound('article');
      const comments = (await prisma.comment.findMany({
        where: { articleId: article.id },
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      })) as RawComment[];
      const map = await followingMap(viewerId, Array.from(new Set(comments.map((c) => c.author.id))));
      return { comments: comments.map((c) => serialize(c, map.has(c.author.id))) };
    },

    async create(slug: string, authorId: number, input: CreateCommentInput): Promise<{ comment: CommentView }> {
      const article = await prisma.article.findUnique({ where: { slug } });
      if (!article) throw Errors.notFound('article');
      const created = (await prisma.comment.create({
        data: { body: input.body, articleId: article.id, authorId },
        include: { author: true },
      })) as RawComment;
      return { comment: serialize(created, false) };
    },

    async delete(slug: string, commentId: number, requesterId: number): Promise<void> {
      const article = await prisma.article.findUnique({ where: { slug } });
      if (!article) throw Errors.notFound('article');
      const existing = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!existing || existing.articleId !== article.id) throw Errors.notFound('comment');
      if (existing.authorId !== requesterId) throw Errors.forbidden();
      await prisma.comment.delete({ where: { id: commentId } });
    },
  };
}

export type CommentService = ReturnType<typeof makeCommentService>;
