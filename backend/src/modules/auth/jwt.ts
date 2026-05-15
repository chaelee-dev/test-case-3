import jwt, { type SignOptions } from 'jsonwebtoken';

const SECRET = (process.env.JWT_SECRET ?? 'dev-secret-do-not-use-in-prod') as string;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export interface JwtPayload {
  sub: number;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded)) {
    throw new Error('invalid token payload');
  }
  const payload = decoded as unknown as { sub: number | string; username?: string };
  return { sub: Number(payload.sub), username: String(payload.username ?? '') };
}

export function extractTokenFromHeader(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Token\s+(.+)$/i) ?? header.match(/^Bearer\s+(.+)$/i);
  return match ? (match[1] ?? null) : null;
}
