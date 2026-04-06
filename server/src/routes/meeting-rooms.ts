import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { meetingService } from '../services/meeting.service.js';
import { getSocketServer } from '../services/notification.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// 모든 회의실 API는 인증 필수
router.use(authenticate);

// --- GET /api/meeting-rooms --- 활성 목록
router.get('/', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rooms = await meetingService.listActive();
    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
});

// --- GET /api/meeting-rooms/me/current --- 내 현재 회의실
router.get('/me/current', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await meetingService.getCurrentRoom(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// --- POST /api/meeting-rooms --- 생성
const createSchema = {
  body: z.object({
    title: z.string().min(1).max(100),
    isPrivate: z.boolean().default(false),
    password: z.string().min(4).max(20).optional(),
    inviteeIds: z.array(z.number()).optional(),
  }).refine(
    (d) => !d.isPrivate || (d.isPrivate && d.password),
    { message: '비공개 회의실은 비밀번호가 필요합니다.', path: ['password'] }
  ),
};

router.post('/', validate(createSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, isPrivate, password, inviteeIds } = req.body;
    const result = await meetingService.create(req.user!.userId, title, isPrivate, password, inviteeIds);

    // Socket: 전체에 회의실 생성 알림
    const io = getSocketServer();
    if (io) {
      io.to('global').emit('meeting:created', { room: result.room });
      io.emit('team:statusChanged', { userId: String(req.user!.userId), status: 'IN_MEETING' });

      // 초대 대상에게 알림
      if (result.inviteeIds.length > 0) {
        // 초대 대상의 socket을 찾아서 개별 emit
        for (const [, socket] of io.sockets.sockets) {
          const su = (socket.data as Record<string, unknown>).user as { userId: number } | undefined;
          if (su && result.inviteeIds.includes(su.userId)) {
            socket.emit('meeting:invited', {
              roomId: result.room.id,
              roomTitle: result.room.title,
              invitedBy: result.room.creatorName,
            });
          }
        }
      }
    }

    res.status(201).json({ success: true, data: result.room });
  } catch (err) { next(err); }
});

// --- POST /api/meeting-rooms/:id/join --- 참여
const joinSchema = {
  body: z.object({
    password: z.string().optional(),
  }),
};

router.post('/:id/join', validate(joinSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId)) return res.status(400).json({ success: false, message: 'Invalid room ID' });
    const { password } = req.body;
    const result = await meetingService.join(req.user!.userId, roomId, req.user!.role, password);

    // Socket: 참여 알림 (ADMIN이면 emit 안 함)
    const io = getSocketServer();
    const joinedUser = result.participants.find((p: { id: number }) => p.id === req.user!.userId);
    if (io && req.user!.role !== 'ADMIN') {
      io.to(`meeting:${roomId}`).emit('meeting:joined', {
        roomId,
        user: { id: req.user!.userId, name: joinedUser?.name || '' },
      });
    }
    if (io) {
      io.emit('team:statusChanged', { userId: String(req.user!.userId), status: 'IN_MEETING' });
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// --- POST /api/meeting-rooms/:id/leave --- 퇴장
router.post('/:id/leave', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId)) return res.status(400).json({ success: false, message: 'Invalid room ID' });
    const result = await meetingService.leave(req.user!.userId, roomId);

    const io = getSocketServer();
    if (io) {
      io.to(`meeting:${roomId}`).emit('meeting:left', { roomId, userId: req.user!.userId });
      io.emit('team:statusChanged', { userId: String(req.user!.userId), status: result.restoredStatus || 'AVAILABLE' });

      if (result.closed) {
        io.to('global').emit('meeting:closed', { roomId });
      }
    }

    res.json({ success: true, data: { closed: result.closed } });
  } catch (err) { next(err); }
});

export default router;
