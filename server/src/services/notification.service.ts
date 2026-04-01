// ============================================================
// 알림 서비스 (Socket.io 브로드캐스트)
// ============================================================

import type { Server as SocketIOServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, TaskStatus } from '../types/index.js';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

/**
 * Socket.io 서버 인스턴스 등록. 서버 초기화 시 1회 호출.
 */
export function setSocketServer(
  server: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
): void {
  io = server;
}

/**
 * Socket.io 서버 인스턴스 반환.
 */
export function getSocketServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null {
  return io;
}

// --- 브로드캐스트 함수들 ---

export function emitTaskCreated(task: unknown): void {
  io?.emit('task:created', { task });
}

export function emitTaskUpdated(task: unknown): void {
  io?.emit('task:updated', { task });
}

export function emitTaskDeleted(taskId: number | string): void {
  io?.emit('task:deleted', { taskId: String(taskId) });
}

export function emitTaskProgress(taskId: number | string, progress: number, testType: string): void {
  io?.emit('task:progress', { taskId: String(taskId), progress, testType });
}

export function emitTaskStatusChanged(taskId: number | string, from: TaskStatus, to: TaskStatus): void {
  io?.emit('task:statusChanged', { taskId: String(taskId), from, to });
}

export function emitMemberStatusChanged(userId: number | string, status: string): void {
  io?.emit('team:statusChanged', { userId: String(userId), status });
}

export function emitProjectUpdated(project: unknown): void {
  io?.emit('project:updated', { project });
}

export function emitDashboardRefresh(reason: string): void {
  io?.emit('dashboard:refresh', { reason });
}

/**
 * 특정 프로젝트 방에만 이벤트 전송.
 */
export function emitToProject(projectId: string, event: keyof ServerToClientEvents, data: unknown): void {
  io?.to(`project:${projectId}`).emit(event, data as never);
}
