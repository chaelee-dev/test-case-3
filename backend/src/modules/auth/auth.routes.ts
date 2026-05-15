import { Router } from 'express';
import { LoginSchema, RegisterSchema, UpdateUserSchema } from './auth.schemas.js';
import { makeAuthService, type AuthService } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db/client.js';

export function makeAuthRouter(service: AuthService = makeAuthService(prisma)): Router {
  const r = Router();

  // POST /api/users — register
  r.post('/users', async (req, res, next) => {
    try {
      const parsed = RegisterSchema.parse(req.body);
      const result = await service.register(parsed.user);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  // POST /api/users/login
  r.post('/users/login', async (req, res, next) => {
    try {
      const parsed = LoginSchema.parse(req.body);
      const result = await service.login(parsed.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  // GET /api/user — current user
  r.get('/user', requireAuth, async (req, res, next) => {
    try {
      const result = await service.me(req.user!.sub);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  // PUT /api/user — update
  r.put('/user', requireAuth, async (req, res, next) => {
    try {
      const parsed = UpdateUserSchema.parse(req.body);
      const result = await service.update(req.user!.sub, parsed.user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
