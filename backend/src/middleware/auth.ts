import type { Request, Response, NextFunction } from 'express';
import { Errors } from '../errors/AppError.js';
import { extractTokenFromHeader, verifyToken, type JwtPayload } from '../modules/auth/jwt.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) return next(Errors.unauthorized('token missing'));
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(Errors.unauthorized('token expired or invalid'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore — optional
    }
  }
  next();
}
