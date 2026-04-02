// ============================================================
// Build 서비스 (CRUD + 상태 전이 + 일감 연결)
// ============================================================

import prisma from '../prisma.js';
import type { BuildStatus, BuildFilterParams } from '../types/index.js';
import { VALID_BUILD_TRANSITIONS, ConflictError, NotFoundError, AppError } from '../types/index.js';
import {
  emitBuildCreated,
  emitBuildUpdated,
  emitBuildDeleted,
  emitBuildStatusChanged,
  emitDashboardRefresh,
} from './notification.service.js';

// --- 조회 ---

export async function getBuilds(options: BuildFilterParams) {
  const {
    projectId,
    status,
    updateTarget,
    page = 1,
    size = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = options;

  const where: Record<string, unknown> = { isDeleted: false };

  if (projectId) where.projectId = Number(projectId);
  if (status) where.status = status;
  if (updateTarget) where.updateTarget = new Date(updateTarget);

  const [builds, total] = await Promise.all([
    prisma.build.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { buildVersions: true, taskLinks: true } },
        buildVersions: true,
      },
      orderBy: { [sortBy]: order },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.build.count({ where }),
  ]);

  return {
    builds,
    pagination: { page, size, total, totalPages: Math.ceil(total / size) },
  };
}

export async function getBuildById(id: number) {
  const build = await prisma.build.findFirst({
    where: { id, isDeleted: false },
    include: {
      project: { select: { id: true, name: true, color: true } },
      buildVersions: { orderBy: { createdAt: 'asc' } },
      taskLinks: {
        include: {
          task: {
            select: { id: true, title: true, status: true, priority: true, assigneeName: true },
          },
        },
      },
    },
  });

  if (!build) throw new NotFoundError('Build');
  return build;
}

// --- 업데이트 타겟 조회 (일감 연동용) ---

export async function getUpdateTargets(projectId: number) {
  const results = await prisma.build.findMany({
    where: { projectId, isDeleted: false },
    select: { updateTarget: true },
    distinct: ['updateTarget'],
    orderBy: { updateTarget: 'desc' },
  });

  return results.map((r) => r.updateTarget);
}

// --- CDN 타입 자동완성 ---

export async function getCdnTypes(projectId: number) {
  const results = await prisma.buildVersion.findMany({
    where: {
      buildType: 'CDN',
      cdnType: { not: null },
      build: { projectId, isDeleted: false },
    },
    select: { cdnType: true },
    distinct: ['cdnType'],
    orderBy: { cdnType: 'asc' },
  });

  return results.map((r) => r.cdnType).filter(Boolean);
}

// --- 생성 ---

interface CreateBuildData {
  projectId: number;
  buildOrder: number;
  receivedDate: string;
  updateTarget: string;
  status?: string;
  memo?: string;
  versions?: {
    buildType: string;
    platform?: string;
    cdnType?: string;
    version: string;
    note?: string;
  }[];
}

export async function createBuild(data: CreateBuildData, createdBy: number) {
  try {
  const build = await prisma.build.create({
    data: {
      projectId: data.projectId,
      buildOrder: data.buildOrder,
      receivedDate: new Date(data.receivedDate),
      updateTarget: new Date(data.updateTarget),
      status: data.status || 'RECEIVED',
      memo: data.memo,
      createdBy,
      buildVersions: data.versions
        ? {
            create: data.versions.map((v) => ({
              buildType: v.buildType,
              platform: v.platform,
              cdnType: v.cdnType,
              version: v.version,
              note: v.note,
            })),
          }
        : undefined,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      buildVersions: true,
      _count: { select: { taskLinks: true } },
    },
  });

  emitBuildCreated(build);
  emitDashboardRefresh('build:created');

  return build;
  } catch (err: unknown) {
    // Prisma P2002: Unique constraint violation
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new ConflictError('이미 동일한 프로젝트/타겟/차수의 빌드가 존재합니다.');
    }
    throw err;
  }
}

// --- 수정 (낙관적 잠금) ---

interface UpdateBuildData {
  buildOrder?: number;
  receivedDate?: string;
  updateTarget?: string;
  memo?: string;
  version: number;
}

export async function updateBuild(id: number, data: UpdateBuildData) {
  const { version, ...updateFields } = data;

  const result = await prisma.build.updateMany({
    where: { id, version, isDeleted: false },
    data: {
      ...updateFields,
      ...(updateFields.receivedDate ? { receivedDate: new Date(updateFields.receivedDate) } : {}),
      ...(updateFields.updateTarget ? { updateTarget: new Date(updateFields.updateTarget) } : {}),
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.build.findFirst({ where: { id, isDeleted: false } });
    if (!exists) throw new NotFoundError('Build');
    throw new ConflictError();
  }

  const updatedBuild = await getBuildById(id);
  emitBuildUpdated(updatedBuild);
  emitDashboardRefresh('build:updated');

  return updatedBuild;
}

// --- 삭제 (soft delete) ---

export async function deleteBuild(id: number) {
  const build = await prisma.build.findFirst({ where: { id, isDeleted: false } });
  if (!build) throw new NotFoundError('Build');

  await prisma.build.update({
    where: { id },
    data: { isDeleted: true, updatedAt: new Date() },
  });

  emitBuildDeleted(id);
  emitDashboardRefresh('build:deleted');

  return { id };
}

// --- 상태 변경 ---

export async function changeBuildStatus(id: number, newStatus: BuildStatus) {
  const build = await prisma.build.findFirst({ where: { id, isDeleted: false } });
  if (!build) throw new NotFoundError('Build');

  const currentStatus = build.status as BuildStatus;

  const allowed = VALID_BUILD_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      400,
      `Invalid build status transition: ${currentStatus} → ${newStatus}. Allowed: [${allowed?.join(', ') || 'none'}]`,
    );
  }

  const updatedBuild = await prisma.build.update({
    where: { id },
    data: {
      status: newStatus,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      buildVersions: true,
    },
  });

  emitBuildStatusChanged(id, currentStatus, newStatus);
  emitDashboardRefresh('build:statusChanged');

  return updatedBuild;
}

// --- BuildVersion CRUD ---

interface CreateVersionData {
  buildType: string;
  platform?: string;
  cdnType?: string;
  version: string;
  note?: string;
}

export async function addBuildVersion(buildId: number, data: CreateVersionData) {
  const build = await prisma.build.findFirst({ where: { id: buildId, isDeleted: false } });
  if (!build) throw new NotFoundError('Build');

  const version = await prisma.buildVersion.create({
    data: {
      buildId,
      buildType: data.buildType,
      platform: data.platform,
      cdnType: data.cdnType,
      version: data.version,
      note: data.note,
    },
  });

  emitBuildUpdated(await getBuildById(buildId));
  return version;
}

export async function updateBuildVersion(buildId: number, versionId: number, data: Partial<CreateVersionData>) {
  const bv = await prisma.buildVersion.findFirst({
    where: { id: versionId, buildId },
    include: { build: { select: { isDeleted: true } } },
  });
  if (!bv || bv.build.isDeleted) throw new NotFoundError('BuildVersion');

  const updated = await prisma.buildVersion.update({
    where: { id: versionId },
    data: {
      ...(data.buildType !== undefined ? { buildType: data.buildType } : {}),
      ...(data.platform !== undefined ? { platform: data.platform } : {}),
      ...(data.cdnType !== undefined ? { cdnType: data.cdnType } : {}),
      ...(data.version !== undefined ? { version: data.version } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });

  emitBuildUpdated(await getBuildById(buildId));
  return updated;
}

export async function deleteBuildVersion(buildId: number, versionId: number) {
  const bv = await prisma.buildVersion.findFirst({
    where: { id: versionId, buildId },
    include: { build: { select: { isDeleted: true } } },
  });
  if (!bv || bv.build.isDeleted) throw new NotFoundError('BuildVersion');

  await prisma.buildVersion.delete({ where: { id: versionId } });

  emitBuildUpdated(await getBuildById(buildId));
  return { id: versionId };
}

// --- 일감 연결/해제 ---

export async function linkTasks(buildId: number, taskIds: number[], createdBy: number) {
  const build = await prisma.build.findFirst({ where: { id: buildId, isDeleted: false } });
  if (!build) throw new NotFoundError('Build');

  const links = await Promise.all(
    taskIds.map((taskId) =>
      prisma.taskBuildLink.upsert({
        where: { taskId_buildId: { taskId, buildId } },
        update: {},
        create: { taskId, buildId, createdBy },
      }),
    ),
  );

  emitBuildUpdated(await getBuildById(buildId));
  emitDashboardRefresh('build:tasksLinked');

  return links;
}

export async function unlinkTask(buildId: number, taskId: number) {
  const link = await prisma.taskBuildLink.findUnique({
    where: { taskId_buildId: { taskId, buildId } },
  });
  if (!link) throw new NotFoundError('TaskBuildLink');

  await prisma.taskBuildLink.delete({
    where: { taskId_buildId: { taskId, buildId } },
  });

  emitBuildUpdated(await getBuildById(buildId));
  return { taskId, buildId };
}
