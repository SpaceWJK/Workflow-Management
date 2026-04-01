// ============================================================
// Express app 설정
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import teamRoutes from './routes/team.js';
import calendarRoutes from './routes/calendar.js';
import leaveRoutes from './routes/leaves.js';
import settingsRoutes from './routes/settings.js';
import { globalErrorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // --- 공통 미들웨어 ---
  app.use(helmet());
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- 글로벌 Rate Limiting ---
  app.use('/api', rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 100,                 // IP당 100요청/분
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // --- Health Check ---
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // --- API 라우트 ---
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/settings', settingsRoutes);

  // --- 404 + 글로벌 에러 핸들러 ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
