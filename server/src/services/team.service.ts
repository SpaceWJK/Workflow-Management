// ============================================================
// Team 서비스
// ============================================================

import prisma from '../prisma.js';
import { NotFoundError } from '../types/index.js';
import { emitMemberStatusChanged, emitDashboardRefresh } from './notification.service.js';

export async function getTeamMembers(options?: { projectId?: number; page?: number; size?: number }) {
  const page = options?.page || 1;
  const size = options?.size || 50;

  const where: Record<string, unknown> = { isActive: true };

  if (options?.projectId) {
    where.projectMembers = {
      some: { projectId: options.projectId },
    };
  }

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamStatus: true,
        projectMembers: {
          include: {
            project: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            assignedTasks: { where: { isDeleted: false, status: { notIn: ['DONE', 'CANCELED'] } } },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    members,
    pagination: { page, size, total, totalPages: Math.ceil(total / size) },
  };
}

export async function getMemberById(id: number) {
  const member = await prisma.user.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamStatus: true,
      projectMembers: {
        include: {
          project: { select: { id: true, name: true } },
        },
      },
      assignedTasks: {
        where: { isDeleted: false },
        select: { id: true, title: true, status: true, priority: true, progressTotal: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!member) throw new NotFoundError('Team member');
  return member;
}

export async function updateMemberStatus(id: number, status: string) {
  const member = await prisma.user.findFirst({ where: { id, isActive: true } });
  if (!member) throw new NotFoundError('Team member');

  const updated = await prisma.user.update({
    where: { id },
    data: { teamStatus: status },
    select: { id: true, name: true, teamStatus: true },
  });

  emitMemberStatusChanged(id, status);
  emitDashboardRefresh('member:statusChanged');

  return updated;
}

export async function getTeamWorkload(projectId?: number) {
  const where: Record<string, unknown> = { isActive: true };
  if (projectId) {
    where.projectMembers = { some: { projectId } };
  }

  const members = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      assignedTasks: {
        where: {
          isDeleted: false,
          status: { notIn: ['DONE', 'CANCELED'] },
        },
        select: {
          id: true,
          status: true,
          priority: true,
          riskLevel: true,
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return members.map((m: any) => ({
    userId: m.id,
    name: m.name,
    totalTasks: m.assignedTasks.length,
    byStatus: groupBy(m.assignedTasks, 'status'),
    byPriority: groupBy(m.assignedTasks, 'priority'),
    criticalRiskCount: m.assignedTasks.filter((t: any) => t.riskLevel === 'CRITICAL').length,
  }));
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const val = String(item[key] || 'UNKNOWN');
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
