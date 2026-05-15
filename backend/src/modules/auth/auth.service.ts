import type { PrismaClient, User } from '@prisma/client';
import { Errors } from '../../errors/AppError.js';
import { hashPassword, comparePassword } from './password.js';
import { signToken } from './jwt.js';
import type { LoginInput, RegisterInput, UpdateUserInput } from './auth.schemas.js';

export interface UserResponse {
  user: {
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
    token: string;
  };
}

function toResponse(user: User): UserResponse {
  return {
    user: {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: signToken({ sub: user.id, username: user.username }),
    },
  };
}

export function makeAuthService(prisma: Pick<PrismaClient, 'user'>) {
  return {
    async register(input: RegisterInput): Promise<UserResponse> {
      const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
      if (emailTaken) throw Errors.conflict('email');
      const usernameTaken = await prisma.user.findUnique({ where: { username: input.username } });
      if (usernameTaken) throw Errors.conflict('username');

      const passwordHash = await hashPassword(input.password);
      const created = await prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          passwordHash,
        },
      });
      return toResponse(created);
    },

    async login(input: LoginInput): Promise<UserResponse> {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user) throw Errors.invalidCredentials();
      const ok = await comparePassword(input.password, user.passwordHash);
      if (!ok) throw Errors.invalidCredentials();
      return toResponse(user);
    },

    async me(userId: number): Promise<UserResponse> {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw Errors.notFound('user');
      return toResponse(user);
    },

    async update(userId: number, input: UpdateUserInput): Promise<UserResponse> {
      if (input.email) {
        const existing = await prisma.user.findUnique({ where: { email: input.email } });
        if (existing && existing.id !== userId) throw Errors.conflict('email');
      }
      if (input.username) {
        const existing = await prisma.user.findUnique({ where: { username: input.username } });
        if (existing && existing.id !== userId) throw Errors.conflict('username');
      }
      const data: Record<string, unknown> = {};
      if (input.email !== undefined) data['email'] = input.email;
      if (input.username !== undefined) data['username'] = input.username;
      if (input.bio !== undefined) data['bio'] = input.bio;
      if (input.image !== undefined) data['image'] = input.image;
      if (input.password !== undefined) data['passwordHash'] = await hashPassword(input.password);

      const updated = await prisma.user.update({ where: { id: userId }, data });
      return toResponse(updated);
    },
  };
}

export type AuthService = ReturnType<typeof makeAuthService>;
