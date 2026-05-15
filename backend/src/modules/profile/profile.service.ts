import type { PrismaClient } from '@prisma/client';
import { Errors } from '../../errors/AppError.js';

export interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export function makeProfileService(prisma: Pick<PrismaClient, 'user' | 'follow'>) {
  async function isFollowing(followerId: number | undefined, followingId: number): Promise<boolean> {
    if (!followerId || followerId === followingId) return false;
    const row = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return row !== null;
  }

  return {
    async get(username: string, viewerId: number | undefined): Promise<ProfileResponse> {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw Errors.notFound('profile');
      return {
        profile: {
          username: user.username,
          bio: user.bio,
          image: user.image,
          following: await isFollowing(viewerId, user.id),
        },
      };
    },

    async follow(username: string, viewerId: number): Promise<ProfileResponse> {
      const target = await prisma.user.findUnique({ where: { username } });
      if (!target) throw Errors.notFound('profile');
      if (target.id === viewerId) throw Errors.selfFollow();
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
        create: { followerId: viewerId, followingId: target.id },
        update: {},
      });
      return {
        profile: {
          username: target.username,
          bio: target.bio,
          image: target.image,
          following: true,
        },
      };
    },

    async unfollow(username: string, viewerId: number): Promise<ProfileResponse> {
      const target = await prisma.user.findUnique({ where: { username } });
      if (!target) throw Errors.notFound('profile');
      try {
        await prisma.follow.delete({
          where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
        });
      } catch {
        // idempotent unfollow — ignore if row absent
      }
      return {
        profile: {
          username: target.username,
          bio: target.bio,
          image: target.image,
          following: false,
        },
      };
    },
  };
}

export type ProfileService = ReturnType<typeof makeProfileService>;
