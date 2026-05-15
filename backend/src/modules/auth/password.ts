import bcrypt from 'bcryptjs';

const cost = Number(process.env.BCRYPT_COST ?? 10);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, cost);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
