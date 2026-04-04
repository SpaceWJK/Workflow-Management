// ============================================================
// Project 서비스
// ============================================================

import prisma from '../prisma.js';
import { NotFoundError, ConflictError } from '../types/index.js';
import { emitProjectUpdated, emitDashboardRefresh } from './notification.service.js';

export async function getProjects(options?: { page?: number; size?: number }) {
  const page = options?.page || 1;
  const size = options?.size || 20;

  const [rawProjects, total] = await Promise.all([
    prisma.project.findMany({
      where: { isDeleted: false },
      include: {
        _count: {
          select: {
            tasks: { where: { isDeleted: false } },
          },
        },
        tasks: {
          where: { isDeleted: false },
          select: { id: true, status: true, progressTotal: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.project.count({ where: { isDeleted: false } }),
  ]);

  // 일감 통계 계산
  const projects = rawProjects.map((p) => {
    const taskCount = p.tasks.length;
    const completedCount = p.tasks.filter((t) => t.status === 'DONE').length;
    const inProgressCount = p.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const progressTotal = taskCount > 0
      ? Math.round(p.tasks.reduce((sum, t) => sum + Number(t.progressTotal || 0), 0) / taskCount)
      : 0;
    const { tasks: _tasks, ...rest } = p;
    return { ...rest, taskCount, completedCount, inProgressCount, progressTotal };
  });

  return {
    projects,
    pagination: { page, size, total, totalPages: Math.ceil(total / size) },
  };
}

export async function getProjectById(id: number) {
  const project = await prisma.project.findFirst({
    where: { id, isDeleted: false },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      tasks: {
        where: { isDeleted: false },
        select: { id: true, title: true, status: true, priority: true, progressTotal: true, dueDate: true },
      },
    },
  });

  if (!project) throw new NotFoundError('Project');

  // 통계 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskCount = project.tasks.length;
  const completedCount = project.tasks.filter((t) => t.status === 'DONE').length;
  const delayedCount = project.tasks.filter((t) =>
    t.status !== 'DONE' && t.status !== 'CANCELED' && t.dueDate && new Date(t.dueDate) < today
  ).length;
  const progressTotal = taskCount > 0
    ? Math.round(project.tasks.reduce((sum, t) => sum + Number(t.progressTotal || 0), 0) / taskCount)
    : 0;

  return { ...project, taskCount, completedCount, delayedCount, progressTotal };
}

interface CreateProjectData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function createProject(data: CreateProjectData, createdBy: number) {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status || 'PLANNING',
      createdBy,
    },
  });

  emitDashboardRefresh('project:created');
  return project;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  version: number;
}

export async function updateProject(id: number, data: UpdateProjectData) {
  const { version, ...updateFields } = data;

  const result = await prisma.project.updateMany({
    where: { id, version, isDeleted: false },
    data: {
      ...updateFields,
      startDate: updateFields.startDate ? new Date(updateFields.startDate) : undefined,
      endDate: updateFields.endDate ? new Date(updateFields.endDate) : undefined,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.project.findFirst({ where: { id, isDeleted: false } });
    if (!exists) throw new NotFoundError('Project');
    throw new ConflictError();
  }

  const updatedProject = await getProjectById(id);
  emitProjectUpdated(updatedProject);
  emitDashboardRefresh('project:updated');

  return updatedProject;
}

export async function deleteProject(id: number) {
  const project = await prisma.project.findFirst({ where: { id, isDeleted: false } });
  if (!project) throw new NotFoundError('Project');

  await prisma.project.update({
    where: { id },
    data: { isDeleted: true, updatedAt: new Date() },
  });

  emitDashboardRefresh('project:deleted');
  return { id };
}
