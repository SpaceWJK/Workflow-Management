// ============================================================
// CalendarEvent 서비스 — 개인 일정 CRUD
// ============================================================

import prisma from '../prisma.js';
import { NotFoundError, ForbiddenError } from '../types/index.js';
import {
  emitCalendarEventCreated,
  emitCalendarEventUpdated,
  emitCalendarEventDeleted,
} from './notification.service.js';

// --- 조회 ---

export async function getEvents(startDate: string, endDate: string, userId?: number) {
  const where: Record<string, unknown> = {
    isDeleted: false,
    startDate: { lte: new Date(endDate) },
    endDate:   { gte: new Date(startDate) },
  };

  if (userId) where.userId = userId;

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return events;
}

// --- 생성 ---

interface CreateEventData {
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  memo?: string;
}

export async function createEvent(data: CreateEventData, userId: number) {
  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title:     data.title,
      type:      data.type,
      startDate: new Date(data.startDate),
      endDate:   new Date(data.endDate),
      allDay:    data.allDay ?? true,
      memo:      data.memo,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  emitCalendarEventCreated(event);

  return event;
}

// --- 수정 ---

interface UpdateEventData {
  title?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  memo?: string;
}

export async function updateEvent(id: number, data: UpdateEventData, userId: number) {
  const event = await prisma.calendarEvent.findFirst({ where: { id, isDeleted: false } });
  if (!event) throw new NotFoundError('CalendarEvent');

  // 본인 소유 확인
  if (event.userId !== userId) {
    throw new ForbiddenError('본인의 일정만 수정할 수 있습니다.');
  }

  const updated = await prisma.calendarEvent.update({
    where: { id },
    data: {
      ...(data.title     !== undefined ? { title: data.title }                       : {}),
      ...(data.type      !== undefined ? { type: data.type }                         : {}),
      ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) }     : {}),
      ...(data.endDate   !== undefined ? { endDate: new Date(data.endDate) }         : {}),
      ...(data.allDay    !== undefined ? { allDay: data.allDay }                     : {}),
      ...(data.memo      !== undefined ? { memo: data.memo }                         : {}),
      updatedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  emitCalendarEventUpdated(updated);

  return updated;
}

// --- 삭제 (Soft Delete) ---

export async function deleteEvent(id: number, userId: number) {
  const event = await prisma.calendarEvent.findFirst({ where: { id, isDeleted: false } });
  if (!event) throw new NotFoundError('CalendarEvent');

  // 본인 소유 확인
  if (event.userId !== userId) {
    throw new ForbiddenError('본인의 일정만 삭제할 수 있습니다.');
  }

  await prisma.calendarEvent.update({
    where: { id },
    data: { isDeleted: true, updatedAt: new Date() },
  });

  emitCalendarEventDeleted(id);

  return { id };
}
