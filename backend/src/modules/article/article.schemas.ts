import { z } from 'zod';

export const CreateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank").max(200),
    description: z.string().min(1, "can't be blank").max(500),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string().min(1).max(40)).max(20).optional(),
  }),
});

export const UpdateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(500).optional(),
      body: z.string().min(1).optional(),
    })
    .refine((a) => Object.keys(a).length > 0, { message: 'no fields to update' }),
});

export const ListArticlesQuery = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const FeedQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>['article'];
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>['article'];
export type ListArticlesInput = z.infer<typeof ListArticlesQuery>;
export type FeedInput = z.infer<typeof FeedQuery>;
