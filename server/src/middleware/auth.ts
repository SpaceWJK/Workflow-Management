// ============================================================
// JWT 인증 미들웨어
// ============================================================

import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, JwtPayload, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../types/index.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.');
}
export const JWT_SECRET: string = process.env.JWT_SECRET;

/**
 * JWT 토큰 검증 미들웨어.
 * Authorization: Bearer <token> 형태에서 토큰을 추출하여 검증한다.
 * 검증 성공 시 req.user에 JwtPayload를 설정한다.
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.slice(7); // 'Bearer '.length === 7

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * 역할(Role) 기반 인가 미들웨어.
 * authenticate 이후에 사용해야 한다.
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`));
    }

    next();
  };
}
