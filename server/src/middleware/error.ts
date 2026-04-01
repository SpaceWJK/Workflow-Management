// ============================================================
// 글로벌 에러 핸들러 미들웨어
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/index.js';
import type { ApiResponse } from '../types/index.js';

/**
 * 글로벌 에러 핸들링 미들웨어.
 * AppError 인스턴스는 statusCode와 errors를 사용하고,
 * 일반 Error는 500으로 처리한다.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
    };

    if (err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Zod 에러가 미들웨어를 우회한 경우 (방어)
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: (err as unknown as { issues: Array<{ path: string[]; message: string }> }).issues?.map(
        (i) => `${i.path.join('.')}: ${i.message}`,
      ),
    });
    return;
  }

  // 예상치 못한 에러
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
  });
}

/**
 * 404 Not Found 핸들러.
 * 등록되지 않은 경로에 대한 요청을 처리한다.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
}
