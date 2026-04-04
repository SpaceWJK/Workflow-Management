// ============================================================
// Task 서비스 (CRUD + Optimistic Locking + 상태 전이)
// ============================================================

import prisma from '../prisma.js';
import type { TaskStatus, TaskFilterParams, UserRole } from '../types/index.js';
import { VALID_TRANSITIONS, ConflictError, NotFoundError, AppError, ForbiddenError } from '../types/index.js';
import { assessRisk } from './risk.service.js';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskDeleted,
  emitTaskProgress,
  emitTaskStatusChanged,
  emitDashboardRefresh,
} from './notification.service.js';
import { stopTimerByTaskId } from './timer.service.js';

// --- 조회 ---

interface GetTasksOptions extends TaskFilterParams {}

export async function getTasks(options: GetTasksOptions) {
  const {
    projectId,
    assigneeId,
    status,
    priority,
    testType,
    startDate,
    endDate,
    keyword,
    page = 1,
    size = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = options;

  const where: Record<string, unknown> = { isDeleted: false };

  if (projectId) where.projectId = Number(projectId);
  if (assigneeId) where.assigneeId = Number(assigneeId);
  if (status) where.status = status;
  if (priority) where.priority = priority;

  if (testType) {
    where.testTypes = { some: { type: testType } };
  }

  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) (where.dueDate as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.dueDate as Record<string, unknown>).lte = new Date(endDate);
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testTypes: true,
      },
      orderBy: { [sortBy]: order },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    },
  };
}

export async function getTaskById(id: number) {
  const task = await prisma.task.findFirst({
    where: { id, isDeleted: false },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      testTypes: true,
      progressLogs: { orderBy: { changedAt: 'desc' }, take: 50 },
      buildLinks: {
        where: { build: { isDeleted: false } },
        include: {
          build: {
            select: { id: true, buildOrder: true, updateTarget: true, status: true, project: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!task) throw new NotFoundError('Task');
  return task;
}

// --- 생성 ---

interface CreateTaskData {
  title: string;
  description?: string;
  projectId: number;
  assigneeId?: number;
  assigneeName?: string;
  status?: TaskStatus;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  progressTotal?: number;
  testTypes?: { testTypeCode: string; progress?: number; note?: string }[];
}

export async function createTask(data: CreateTaskData, createdBy: number) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      status: data.status || 'PENDING',
      priority: data.priority || 'NORMAL',
      progressTotal: data.progressTotal || 0,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      createdBy,
      testTypes: data.testTypes
        ? {
            create: data.testTypes.map((tt) => ({
              testTypeCode: tt.testTypeCode,
              progress: tt.progress || 0,
              note: tt.note,
            })),
          }
        : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      testTypes: true,
    },
  });

  emitTaskCreated(task);
  emitDashboardRefresh('task:created');

  return task;
}

// --- 수정 (Optimistic Locking) ---

interface UpdateTaskData {
  title?: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  progressTotal?: number;
  memo?: string;
  testTypes?: { id?: number; testTypeCode: string; progress?: number; note?: string }[];
  version: number; // Optimistic Locking 필수
}

export async function updateTask(id: number, data: UpdateTaskData) {
  const { version, testTypes: newTestTypes, ...updateFields } = data;

  // 스칼라 필드만 추출 (Date 변환 포함)
  const scalarData: Record<string, unknown> = {};
  if (updateFields.title !== undefined) scalarData.title = updateFields.title;
  if (updateFields.description !== undefined) scalarData.description = updateFields.description;
  if (updateFields.assigneeId !== undefined) scalarData.assigneeId = updateFields.assigneeId;
  if (updateFields.assigneeName !== undefined) scalarData.assigneeName = updateFields.assigneeName;
  if (updateFields.priority !== undefined) scalarData.priority = updateFields.priority;
  if (updateFields.memo !== undefined) scalarData.memo = updateFields.memo;
  if (updateFields.progressTotal !== undefined) scalarData.progressTotal = updateFields.progressTotal;
  if (updateFields.startDate) scalarData.startDate = new Date(updateFields.startDate);
  if (updateFields.dueDate) scalarData.dueDate = new Date(updateFields.dueDate);

  // Optimistic Locking: version 일치 확인
  const result = await prisma.task.updateMany({
    where: { id, version, isDeleted: false },
    data: {
      ...scalarData,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.task.findFirst({ where: { id, isDeleted: false } });
    if (!exists) throw new NotFoundError('Task');
    throw new ConflictError();
  }

  // testTypes 업데이트: 기존 삭제 후 재생성
  if (newTestTypes !== undefined) {
    await prisma.taskTestType.deleteMany({ where: { taskId: id } });
    if (newTestTypes.length > 0) {
      await prisma.taskTestType.createMany({
        data: newTestTypes.map((tt) => ({
          taskId: id,
          testTypeCode: tt.testTypeCode,
          progress: tt.progress || 0,
          note: tt.note || null,
        })),
      });
    }
  }

  const updatedTask = await getTaskById(id);
  emitTaskUpdated(updatedTask);
  emitDashboardRefresh('task:updated');

  return updatedTask;
}

// --- 삭제 (Soft Delete) ---

export async function deleteTask(id: number) {
  const task = await prisma.task.findFirst({ where: { id, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  await prisma.task.update({
    where: { id },
    data: { isDeleted: true, updatedAt: new Date() },
  });

  emitTaskDeleted(id);
  emitDashboardRefresh('task:deleted');

  return { id };
}

// --- 상태 전이 ---

export async function changeTaskStatus(
  id: number,
  newStatus: TaskStatus,
  userId: number,
  userRole: UserRole,
) {
  const task = await prisma.task.findFirst({ where: { id, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  const currentStatus = task.status as TaskStatus;

  // DONE -> IN_PROGRESS (재오픈)은 Manager 이상만
  if (currentStatus === 'DONE' && newStatus === 'IN_PROGRESS') {
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new ForbiddenError('Only ADMIN or MANAGER can reopen a DONE task');
    }
  }

  // 상태 전이 검증
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new AppError(
      400,
      `Invalid status transition: ${currentStatus} -> ${newStatus}. Allowed: [${allowedTransitions?.join(', ') || 'none'}]`,
    );
  }

  // DONE/CANCELED 진입 시 진행 중 타이머 자동 정지 (트랜잭션 전에 수행)
  if (newStatus === 'DONE' || newStatus === 'CANCELED') {
    await stopTimerByTaskId(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedTask = await prisma.$transaction(async (tx: any) => {
    // 1. Task 상태 업데이트
    const updated = await tx.task.update({
      where: { id },
      data: {
        status: newStatus,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testTypes: true,
        buildLinks: {
          where: { build: { isDeleted: false } },
          include: { build: { select: { id: true, status: true } } },
        },
      },
    });

    // 2. ActivityLog 기록
    await tx.activityLog.create({
      data: {
        entityType: 'TASK',
        entityId: id,
        actionType: 'STATUS_CHANGE',
        oldValue: { status: currentStatus },
        newValue: { status: newStatus },
        changedBy: userId,
      },
    });

    // 3. 빌드 자동 연동 (순환 방지: 직접 prisma.build.update 사용)
    if (newStatus === 'IN_PROGRESS') {
      // 연결 빌드가 RECEIVED 상태이면 TESTING으로 전환
      for (const link of updated.buildLinks) {
        if (link.build.status === 'RECEIVED') {
          await tx.build.update({
            where: { id: link.build.id },
            data: { status: 'TESTING', version: { increment: 1 }, updatedAt: new Date() },
          });
        }
      }
    } else if (newStatus === 'DONE') {
      // 연결 빌드의 모든 일감이 DONE이면 TESTING → TEST_DONE 전환
      for (const link of updated.buildLinks) {
        if (link.build.status === 'TESTING') {
          // 해당 빌드에 연결된 미완료 일감 수 확인
          const pendingCount = await tx.taskBuildLink.count({
            where: {
              buildId: link.build.id,
              task: {
                isDeleted: false,
                status: { notIn: ['DONE', 'CANCELED'] },
                id: { not: id }, // 방금 DONE으로 전환한 현재 task 제외
              },
            },
          });
          if (pendingCount === 0) {
            await tx.build.update({
              where: { id: link.build.id },
              data: { status: 'TEST_DONE', version: { increment: 1 }, updatedAt: new Date() },
            });
          }
        }
      }
    }

    return updated;
  });

  emitTaskStatusChanged(id, currentStatus, newStatus);
  emitDashboardRefresh('task:statusChanged');

  return updatedTask;
}

// --- 진행률 업데이트 ---

interface ProgressUpdateData {
  testTypeId: number;
  progress: number; // 0~100
}

export async function updateTaskProgress(
  taskId: number,
  data: ProgressUpdateData,
  userId: number,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.$transaction(async (tx: any) => {
    // 1. Task 존재 확인
    const task = await tx.task.findFirst({
      where: { id: taskId, isDeleted: false },
      include: { testTypes: true },
    });
    if (!task) throw new NotFoundError('Task');

    // 2. TestType 업데이트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testType = task.testTypes.find((tt: any) => tt.id === data.testTypeId);
    if (!testType) throw new NotFoundError('TestType');

    const oldProgress = testType.progress;

    await tx.taskTestType.update({
      where: { id: data.testTypeId },
      data: { progress: data.progress },
    });

    // 3. 전체 진행률 재계산 (평균)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testTypes = task.testTypes.map((tt: any) =>
      tt.id === data.testTypeId ? { ...tt, progress: data.progress } : tt,
    );
    const totalProgress =
      testTypes.length > 0
        ? Math.round(testTypes.reduce((sum: number, tt: any) => sum + tt.progress, 0) / testTypes.length)
        : 0;

    // 4. Risk 재계산
    const riskResult = task.startDate && task.dueDate
      ? assessRisk({
          status: task.status as TaskStatus,
          startDate: task.startDate,
          dueDate: task.dueDate,
          progress: totalProgress,
          testTypeCount: testTypes.length,
        })
      : null;

    // 5. Task 업데이트
    await tx.task.update({
      where: { id: taskId },
      data: {
        progressTotal: totalProgress,
        riskLevel: riskResult?.riskLevel,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // 6. 이력 기록
    await tx.taskProgressLog.create({
      data: {
        taskId,
        taskTestTypeId: data.testTypeId,
        oldProgress: Number(oldProgress),
        newProgress: data.progress,
        changedBy: userId,
      },
    });

    emitTaskProgress(taskId, totalProgress, testType.type);
    emitDashboardRefresh('task:progress');

    return {
      taskId,
      testTypeId: data.testTypeId,
      testTypeProgress: data.progress,
      totalProgress,
      riskLevel: riskResult?.riskLevel || null,
    };
  });
}

// --- 이력 조회 ---

export async function getTaskHistory(taskId: number) {
  const task = await prisma.task.findFirst({ where: { id: taskId, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  const logs = await prisma.taskProgressLog.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { changedAt: 'desc' },
  });

  return logs;
}

// --- 위험 태스크 조회 ---

export async function getRiskTasks(projectId?: number) {
  const where: Record<string, unknown> = {
    isDeleted: false,
    status: { notIn: ['DONE', 'CANCELED'] },
    startDate: { not: null },
    dueDate: { not: null },
  };

  if (projectId) where.projectId = projectId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      testTypes: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riskTasks = tasks
    .map((task: any) => {
      const risk = assessRisk({
        status: task.status as TaskStatus,
        startDate: task.startDate!,
        dueDate: task.dueDate!,
        progress: Number(task.progressTotal),
        testTypeCount: task.testTypes.length,
      });
      return { ...task, risk };
    })
    .filter((t: any) => t.risk.riskLevel !== 'NONE')
    .sort((a: any, b: any) => {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.risk.riskLevel] ?? 4) - (order[b.risk.riskLevel] ?? 4);
    });

  return riskTasks;
}
