import { z } from 'zod';

export const CreateCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank").max(5000),
  }),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>['comment'];
