import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { AppError, NotFoundError, ForbiddenError } from '../types/index.js';
import type { MeetingRoomInfo, ChatMessage } from '../types/index.js';

export const meetingService = {
  /** 활성 회의실 목록 */
  async listActive(): Promise<MeetingRoomInfo[]> {
    const rooms = await prisma.meetingRoom.findMany({
      where: { isActive: true },
      include: {
        creator: { select: { name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((r) => ({
      id: r.id,
      title: r.title,
      isPrivate: r.isPrivate,
      createdBy: r.createdBy,
      creatorName: r.creator.name,
      participantCount: r._count.participants,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  /** 회의실 생성 */
  async create(userId: number, title: string, isPrivate: boolean, password?: string, inviteeIds?: number[]) {
    // 기존 참여 회의실 있으면 자동 퇴장
    const existing = await prisma.meetingParticipant.findFirst({ where: { userId } });
    if (existing) {
      await this.leave(userId, existing.roomId);
    }

    const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;

    const room = await prisma.meetingRoom.create({
      data: {
        title,
        isPrivate,
        passwordHash,
        createdBy: userId,
        participants: {
          create: {
            userId,
            previousStatus: await this._getUserStatus(userId),
          },
        },
      },
      include: {
        creator: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    });

    // 생성자 상태 → IN_MEETING
    await prisma.user.update({
      where: { id: userId },
      data: { teamStatus: 'IN_MEETING' },
    });

    return {
      room: {
        id: room.id,
        title: room.title,
        isPrivate: room.isPrivate,
        createdBy: room.createdBy,
        creatorName: room.creator.name,
        participantCount: room._count.participants,
        isActive: room.isActive,
        createdAt: room.createdAt.toISOString(),
      } as MeetingRoomInfo,
      inviteeIds: inviteeIds || [],
    };
  },

  /** 회의실 참여 */
  async join(userId: number, roomId: number, userRole: string, password?: string) {
    // 이미 다른 회의실 참여 중인지 확인
    const existing = await prisma.meetingParticipant.findFirst({
      where: { userId },
    });
    if (existing) {
      throw new AppError(409, '이미 다른 회의실에 참여 중입니다. 먼저 퇴장해주세요.');
    }

    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, isActive: true },
    });
    if (!room) throw new NotFoundError('회의실');

    // 비공개방 비밀번호 검증 (ADMIN은 스킵)
    if (room.isPrivate && userRole !== 'ADMIN') {
      if (!password) throw new ForbiddenError('비밀번호가 필요합니다.');
      const valid = room.passwordHash ? await bcrypt.compare(password, room.passwordHash) : false;
      if (!valid) throw new ForbiddenError('비밀번호가 올바르지 않습니다.');
    }

    const prevStatus = await this._getUserStatus(userId);

    await prisma.meetingParticipant.create({
      data: { roomId, userId, previousStatus: prevStatus },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { teamStatus: 'IN_MEETING' },
    });

    // 최근 메시지 50건
    const messages = await this._getRecentMessages(roomId);

    // 참여자 목록 (ADMIN 제외)
    const participants = await this._getParticipants(roomId);

    // passwordHash 제거하여 반환
    const { passwordHash: _, ...safeRoom } = room;
    return { room: safeRoom, messages, participants };
  },

  /** 회의실 퇴장 */
  async leave(userId: number, roomId: number) {
    return await prisma.$transaction(async (tx) => {
      const participant = await tx.meetingParticipant.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (!participant) return { closed: false };

      // 참여자 삭제
      await tx.meetingParticipant.delete({
        where: { id: participant.id },
      });

      // 상태 복원
      await tx.user.update({
        where: { id: userId },
        data: { teamStatus: participant.previousStatus || 'AVAILABLE' },
      });

      // 남은 참여자 수 확인
      const remaining = await tx.meetingParticipant.count({
        where: { roomId },
      });

      let closed = false;
      if (remaining === 0) {
        await tx.meetingRoom.update({
          where: { id: roomId },
          data: { isActive: false },
        });
        closed = true;
      }

      return { closed, restoredStatus: participant.previousStatus || 'AVAILABLE' };
    });
  },

  /** 사용자의 현재 회의실 조회 (새로고침 복원용) */
  async getCurrentRoom(userId: number) {
    const participant = await prisma.meetingParticipant.findFirst({
      where: { userId },
      include: {
        room: {
          include: {
            creator: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
    });

    if (!participant || !participant.room.isActive) return null;

    const messages = await this._getRecentMessages(participant.roomId);
    const participants = await this._getParticipants(participant.roomId);

    return {
      room: {
        id: participant.room.id,
        title: participant.room.title,
        isPrivate: participant.room.isPrivate,
        createdBy: participant.room.createdBy,
        creatorName: participant.room.creator.name,
        participantCount: participant.room._count.participants,
        isActive: participant.room.isActive,
        createdAt: participant.room.createdAt.toISOString(),
      } as MeetingRoomInfo,
      messages,
      participants,
    };
  },

  /** 메시지 저장 */
  async saveMessage(roomId: number, userId: number): Promise<void> {
    // 참여 여부 확인만 (실제 저장은 socket handler에서)
    const participant = await prisma.meetingParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!participant) throw new ForbiddenError('회의실 참여자가 아닙니다.');
  },

  /** 메시지 DB 저장 + 반환 */
  async createMessage(roomId: number, userId: number, content: string): Promise<ChatMessage> {
    const msg = await prisma.meetingMessage.create({
      data: { roomId, userId, content },
      include: { user: { select: { name: true, role: true } } },
    });

    return {
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.userId,
      userName: msg.user.name,
      userRole: msg.user.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    };
  },

  /** disconnect 시 모든 회의실에서 퇴장 */
  async leaveAll(userId: number): Promise<{ closedRoomIds: number[]; restoredStatus: string }> {
    const participants = await prisma.meetingParticipant.findMany({
      where: { userId },
    });

    const closedRoomIds: number[] = [];
    let restoredStatus = 'AVAILABLE';

    for (const p of participants) {
      const result = await this.leave(userId, p.roomId);
      if (result.closed) closedRoomIds.push(p.roomId);
      if (result.restoredStatus) restoredStatus = result.restoredStatus;
    }

    return { closedRoomIds, restoredStatus };
  },

  // ── 내부 헬퍼 ──

  async _getUserStatus(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamStatus: true },
    });
    return user?.teamStatus || 'AVAILABLE';
  },

  async _getRecentMessages(roomId: number): Promise<ChatMessage[]> {
    const msgs = await prisma.meetingMessage.findMany({
      where: { roomId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return msgs.reverse().map((m) => ({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      userName: m.user.name,
      userRole: m.user.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async _getParticipants(roomId: number) {
    const parts = await prisma.meetingParticipant.findMany({
      where: { roomId },
      include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
    });
    // ADMIN 제외
    return parts
      .filter((p) => p.user.role !== 'ADMIN')
      .map((p) => ({
        id: p.user.id,
        name: p.user.name,
        role: p.user.role,
        avatarUrl: p.user.avatarUrl,
      }));
  },
};
