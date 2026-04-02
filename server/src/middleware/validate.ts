// ============================================================
// Zod 스키마 검증 미들웨어
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../types/index.js';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationSchema {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Zod 스키마를 사용한 요청 검증 미들웨어.
 * body, query, params 각각에 대해 스키마를 지정할 수 있다.
 * 검증 통과 시 파싱된 데이터로 req의 해당 필드를 덮어쓴다.
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'query', 'params'];
    const allErrors: Record<string, string[]> = {};

    for (const target of targets) {
      const zodSchema = schema[target];
      if (!zodSchema) continue;

      const result = zodSchema.safeParse(req[target]);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const key = `${target}.${field}`;
          allErrors[key] = (messages as string[]) || ['Invalid value'];
        }
      } else {
        // 파싱 성공: 변환/기본값이 적용된 데이터로 교체
        if (target === 'query') {
          // Express의 req.query는 getter-only이므로 Object.assign으로 덮어쓴다
          const q = req.query as Record<string, unknown>;
          for (const key of Object.keys(q)) delete q[key];
          Object.assign(q, result.data);
        } else {
          (req as unknown as Record<string, unknown>)[target] = result.data;
        }
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return next(new AppError(400, 'Validation failed', allErrors));
    }

    next();
  };
}
