// ============================================================
// Socket.io 서버 설정 + 이벤트
// ============================================================

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';
import { setSocketServer } from './services/notification.service.js';
import { meetingService } from './services/meeting.service.js';
import prisma from './prisma.js';
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

    // --- 회의실 이벤트 ---
    socket.on('meeting:join', async (roomId: number) => {
      // DB에서 실제 참여자인지 확인 (MAJ-5: 비인가 도청 방지)
      try {
        const participant = await prisma.meetingParticipant.findUnique({
          where: { roomId_userId: { roomId, userId: user.userId } },
        });
        if (!participant) {
          console.warn(`[Socket] ${user.email} tried to join meeting:${roomId} without being a participant`);
          return;
        }
        socket.join(`meeting:${roomId}`);
        console.log(`[Socket] ${user.email} joined meeting:${roomId}`);
      } catch (err) {
        console.error(`[Socket] meeting:join verification error:`, err);
      }
    });

    socket.on('meeting:leave', (roomId: number) => {
      socket.leave(`meeting:${roomId}`);
      console.log(`[Socket] ${user.email} left meeting:${roomId}`);
    });

    socket.on('meeting:sendMessage', async (data: { roomId: number; content: string }) => {
      try {
        // 메시지 길이 제한 (MAJ-6)
        const content = typeof data.content === 'string' ? data.content.slice(0, 2000) : '';
        if (!content.trim()) return;

        // 참여자 검증 (MAJ-4) — createMessage 내부에서도 검증하지만 여기서 선행 차단
        const msg = await meetingService.createMessage(data.roomId, user.userId, content.trim());
        io.to(`meeting:${data.roomId}`).emit('meeting:message', {
          roomId: data.roomId,
          message: msg,
        });
      } catch (err) {
        console.error(`[Socket] meeting:sendMessage error:`, err);
      }
    });

    // 연결 해제 — 회의실 자동 퇴장
    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] Disconnected: ${user.email} (${reason})`);
      try {
        const { closedRoomIds, restoredStatus } = await meetingService.leaveAll(user.userId);
        for (const roomId of closedRoomIds) {
          io.to('global').emit('meeting:closed', { roomId });
        }
        io.emit('team:statusChanged', { userId: String(user.userId), status: restoredStatus });
      } catch (err) {
        console.error(`[Socket] disconnect meeting cleanup error:`, err);
      }
    });
  });

  // notification.service에 io 인스턴스 등록
  setSocketServer(io);

  console.log('[Socket] Socket.io initialized');
  return io;
}
