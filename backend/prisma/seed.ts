import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] starting');
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@conduit.example.com' },
    update: {},
    create: {
      email: 'demo@conduit.example.com',
      username: 'demo',
      passwordHash,
      bio: 'Demo seed user.',
      image: null,
    },
  });
  console.log('[seed] done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
