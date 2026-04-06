// ============================================================
// Express app 설정
// ============================================================

import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import teamRoutes from './routes/team.js';
import calendarRoutes from './routes/calendar.js';
import calendarEventRoutes from './routes/calendar-events.js';
import leaveRoutes from './routes/leaves.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import buildRoutes from './routes/builds.js';
import timerRoutes from './routes/timer.js';
import attendanceRoutes from './routes/attendance.js';
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

  // --- 정적 파일 서빙 (아바타 이미지 등) ---
  // import.meta.dirname = server/src/ → .. = server/ → public/uploads
  app.use('/uploads', express.static(path.resolve(import.meta.dirname || '.', '..', 'public', 'uploads')));

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
  app.use('/api/tasks', timerRoutes);       // 타이머: /api/tasks/:taskId/timer/*
  app.use('/api/projects', projectRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/calendar/events', calendarEventRoutes);  // calendarRoutes 보다 먼저 — 경로 충돌 방지
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/builds', buildRoutes);
  app.use('/api/attendance', attendanceRoutes);

  // --- 404 + 글로벌 에러 핸들러 ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
