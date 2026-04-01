// ============================================================
// Socket.io 서버 설정 + 이벤트
// ============================================================

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';
import { setSocketServer } from './services/notification.service.js';
import type { ServerToClientEvents, ClientToServerEvents, JwtPayload } from './types/index.js';

/**
 * Socket.io 서버를 초기화하고 이벤트를 등록한다.
 */
export function initializeSocket(httpServer: HttpServer): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // --- JWT 인증 미들웨어 ---
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      (socket.data as Record<string, unknown>).user = decoded;
      next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  // --- 연결 이벤트 ---
  io.on('connection', (socket) => {
    const user = (socket.data as Record<string, unknown>).user as JwtPayload;
    console.log(`[Socket] Connected: ${user.email} (${socket.id})`);

    // 기본 방: 전체
    socket.join('global');

    // 프로젝트 방 참가
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[Socket] ${user.email} joined project:${projectId}`);
    });

    // 프로젝트 방 퇴장
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket] ${user.email} left project:${projectId}`);
    });

    // 연결 해제
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${user.email} (${reason})`);
    });
  });

  // notification.service에 io 인스턴스 등록
  setSocketServer(io);

  console.log('[Socket] Socket.io initialized');
  return io;
}
