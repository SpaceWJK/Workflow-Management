import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─────────────────────────────────────────────
  // 1. 테스트 유형 코드 (TestTypeCode)
  // ─────────────────────────────────────────────
  const testTypeCodes = [
    { code: 'FUNCTIONAL',    name: '기능 테스트',    description: '기능 요구사항 검증',      sortOrder: 1 },
    { code: 'REGRESSION',    name: '회귀 테스트',    description: '기존 기능 영향도 검증',    sortOrder: 2 },
    { code: 'PERFORMANCE',   name: '성능 테스트',    description: '성능/부하 테스트',         sortOrder: 3 },
    { code: 'SECURITY',      name: '보안 테스트',    description: '보안 취약점 검증',         sortOrder: 4 },
    { code: 'COMPATIBILITY', name: '호환성 테스트',  description: '기기/OS 호환성 검증',      sortOrder: 5 },
    { code: 'MARKET',        name: '마켓 테스트',    description: '마켓 배포 전 검증',        sortOrder: 6 },
  ];

  for (const tt of testTypeCodes) {
    await prisma.testTypeCode.upsert({
      where: { code: tt.code },
      update: {},
      create: tt,
    });
  }
  console.log(`  TestTypeCodes: ${testTypeCodes.length} upserted`);

  // ─────────────────────────────────────────────
  // 2. 기본 사용자 (비밀번호 통일: qa2026!)
  // ─────────────────────────────────────────────
  const commonPassword = await bcrypt.hash('qa2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@qa.com' },
    update: { passwordHash: commonPassword },
    create: {
      name: 'Admin',
      email: 'admin@qa.com',
      passwordHash: commonPassword,
      role: 'ADMIN',
      teamStatus: 'AVAILABLE',
    },
  });
  console.log(`  Admin user: ${admin.email} (id=${admin.id})`);

  // 김우주 ADMIN 계정
  const wjkim = await prisma.user.upsert({
    where: { email: 'es-wjkim@smilegate.com' },
    update: { passwordHash: commonPassword, role: 'ADMIN' },
    create: {
      name: '김우주',
      email: 'es-wjkim@smilegate.com',
      passwordHash: commonPassword,
      role: 'ADMIN',
      teamStatus: 'AVAILABLE',
    },
  });
  console.log(`  김우주 ADMIN: ${wjkim.email} (id=${wjkim.id})`);

  // ─────────────────────────────────────────────
  // 3. 샘플 팀원 4명 (비밀번호 통일: qa2026!)
  // ─────────────────────────────────────────────
  const members = [
    { name: '김팀장', email: 'kim@qa.com',  role: 'QA_MANAGER', teamStatus: 'AVAILABLE' },
    { name: '이검증', email: 'lee@qa.com',  role: 'QA_MEMBER',  teamStatus: 'AVAILABLE' },
    { name: '박테스', email: 'park@qa.com', role: 'QA_MEMBER',  teamStatus: 'BUSY' },
    { name: '최분석', email: 'choi@qa.com', role: 'QA_MEMBER',  teamStatus: 'AVAILABLE' },
  ];

  const createdMembers = [];
  for (const m of members) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { passwordHash: commonPassword },
      create: {
        ...m,
        passwordHash: commonPassword,
      },
    });
    createdMembers.push(user);
  }
  console.log(`  Team members: ${createdMembers.length} upserted`);

  // ─────────────────────────────────────────────
  // 4. 샘플 프로젝트 2개
  // ─────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '에픽세븐 업데이트 QA',
      description: '정기 업데이트 QA 검증 프로젝트',
      status: 'ACTIVE',
      color: '#3B82F6',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      createdBy: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '신규 컨텐츠 QA',
      description: '신규 컨텐츠 출시 전 종합 QA',
      status: 'ACTIVE',
      color: '#10B981',
      startDate: new Date('2026-04-07'),
      endDate: new Date('2026-05-15'),
      createdBy: admin.id,
    },
  });
  console.log(`  Projects: ${project1.name}, ${project2.name}`);

  // ─────────────────────────────────────────────
  // 5. 샘플 일감 5개
  // ─────────────────────────────────────────────
  const manager = createdMembers[0]; // 김팀장
  const member1 = createdMembers[1]; // 이검증
  const member2 = createdMembers[2]; // 박테스
  const member3 = createdMembers[3]; // 최분석

  const tasks = [
    {
      projectId: project1.id,
      title: '메인 스토리 기능 테스트',
      description: '메인 스토리 챕터 추가분 기능 검증',
      assigneeId: member1.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-15'),
      progressTotal: 45,
      expectedProgress: 50,
      riskLevel: 'MEDIUM',
      createdBy: manager.id,
    },
    {
      projectId: project1.id,
      title: 'PvP 밸런스 회귀 테스트',
      description: 'PvP 밸런스 패치 후 회귀 검증',
      assigneeId: member2.id,
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-04-03'),
      dueDate: new Date('2026-04-10'),
      progressTotal: 30,
      expectedProgress: 70,
      riskLevel: 'HIGH',
      createdBy: manager.id,
    },
    {
      projectId: project1.id,
      title: 'UI/UX 호환성 테스트',
      description: '다양한 디바이스 해상도 호환성 검증',
      assigneeId: member3.id,
      priority: 'NORMAL',
      status: 'PENDING',
      startDate: new Date('2026-04-10'),
      dueDate: new Date('2026-04-25'),
      progressTotal: 0,
      expectedProgress: 0,
      riskLevel: 'LOW',
      createdBy: manager.id,
    },
    {
      projectId: project2.id,
      title: '신규 캐릭터 기능 테스트',
      description: '신규 캐릭터 스킬/모션/연출 기능 검증',
      assigneeId: member1.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-04-07'),
      dueDate: new Date('2026-04-20'),
      progressTotal: 60,
      expectedProgress: 40,
      riskLevel: 'LOW',
      createdBy: manager.id,
    },
    {
      projectId: project2.id,
      title: '마켓 배포 전 최종 검증',
      description: '마켓 등록 전 전체 빌드 검증',
      assigneeId: member2.id,
      priority: 'CRITICAL',
      status: 'PENDING',
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-05-10'),
      progressTotal: 0,
      expectedProgress: 0,
      riskLevel: 'LOW',
      createdBy: manager.id,
    },
  ];

  const createdTasks = [];
  for (const t of tasks) {
    const task = await prisma.task.create({ data: t });
    createdTasks.push(task);
  }
  console.log(`  Tasks: ${createdTasks.length} created`);

  // ─────────────────────────────────────────────
  // 6. 일감별 테스트종류 할당
  // ─────────────────────────────────────────────
  const taskTestTypes = [
    // Task 1: 메인 스토리 기능 테스트 -> FUNCTIONAL, REGRESSION
    { taskId: createdTasks[0].id, testTypeCode: 'FUNCTIONAL',  progress: 50 },
    { taskId: createdTasks[0].id, testTypeCode: 'REGRESSION',  progress: 40 },
    // Task 2: PvP 밸런스 회귀 테스트 -> REGRESSION, PERFORMANCE
    { taskId: createdTasks[1].id, testTypeCode: 'REGRESSION',   progress: 35 },
    { taskId: createdTasks[1].id, testTypeCode: 'PERFORMANCE',  progress: 25 },
    // Task 3: UI/UX 호환성 테스트 -> COMPATIBILITY
    { taskId: createdTasks[2].id, testTypeCode: 'COMPATIBILITY', progress: 0 },
    // Task 4: 신규 캐릭터 기능 테스트 -> FUNCTIONAL, SECURITY
    { taskId: createdTasks[3].id, testTypeCode: 'FUNCTIONAL', progress: 65 },
    { taskId: createdTasks[3].id, testTypeCode: 'SECURITY',   progress: 55 },
    // Task 5: 마켓 배포 전 최종 검증 -> MARKET, COMPATIBILITY
    { taskId: createdTasks[4].id, testTypeCode: 'MARKET',        progress: 0 },
    { taskId: createdTasks[4].id, testTypeCode: 'COMPATIBILITY', progress: 0 },
  ];

  for (const ttt of taskTestTypes) {
    await prisma.taskTestType.create({ data: ttt });
  }
  console.log(`  TaskTestTypes: ${taskTestTypes.length} created`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
