import { z } from 'zod';

export const RegisterSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank").max(40),
    email: z.string().email('is invalid'),
    password: z.string().min(8, 'is too short (minimum 8 characters)').max(72),
  }),
});

export const LoginSchema = z.object({
  user: z.object({
    email: z.string().email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

export const UpdateUserSchema = z.object({
  user: z
    .object({
      email: z.string().email('is invalid').optional(),
      username: z.string().min(1).max(40).optional(),
      password: z.string().min(8).max(72).optional(),
      bio: z.string().max(2000).nullable().optional(),
      image: z.string().url('is invalid url').nullable().optional(),
    })
    .refine((u) => Object.keys(u).length > 0, { message: 'no fields to update' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>['user'];
export type LoginInput = z.infer<typeof LoginSchema>['user'];
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>['user'];
