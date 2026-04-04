import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─────────────────────────────────────────────
  // 1. 테스트 유형 코드 (TestTypeCode) — 7종
  // ─────────────────────────────────────────────
  const testTypeCodes = [
    { code: 'UPDATE',        name: '업데이트 테스트(Update)',  description: 'Update Test',                  sortOrder: 0 },
    { code: 'BVT',           name: '구동 테스트(BVT)',        description: 'Build Verification Test',      sortOrder: 1 },
    { code: 'BAT',           name: '인수 테스트(BAT)',        description: 'Build Acceptance Test',         sortOrder: 2 },
    { code: 'FUNCTIONALITY', name: '기능 테스트(Functionality)', description: '기능 요구사항 검증',         sortOrder: 3 },
    { code: 'BUG_VERIFICATION', name: '버그 수정(Bug Verification)', description: '버그 수정 검증',          sortOrder: 4 },
    { code: 'PERFORMANCE',   name: '성능 테스트',             description: '성능/부하 테스트',              sortOrder: 5 },
    { code: 'COMPATIBILITY', name: '호환 테스트(Compatibility)', description: '기기/OS 호환성 검증',       sortOrder: 6 },
    { code: 'LOCALIZATION',  name: '현지화 테스트(Localization)', description: '다국어/현지화 검증',       sortOrder: 7 },
    { code: 'BALANCE',       name: '밸런스 테스트(Balance)',   description: '게임 밸런스 검증',             sortOrder: 8 },
  ];

  // 기존 사용하지 않는 테스트 유형 비활성화
  await prisma.testTypeCode.updateMany({
    where: { code: { notIn: testTypeCodes.map(t => t.code) } },
    data: { isActive: false },
  });

  for (const tt of testTypeCodes) {
    await prisma.testTypeCode.upsert({
      where: { code: tt.code },
      update: { name: tt.name, description: tt.description, sortOrder: tt.sortOrder, isActive: true },
      create: tt,
    });
  }
  console.log(`  TestTypeCodes: ${testTypeCodes.length} upserted`);

  // ─────────────────────────────────────────────
  // 2. 사용자 (비밀번호: qa2026! / 김우주: qnftkwh2026@)
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

  const wjkimPassword = await bcrypt.hash('qnftkwh2026@', 12);
  const wjkim = await prisma.user.upsert({
    where: { email: 'es-wjkim@smilegate.com' },
    update: { role: 'ADMIN' },
    create: {
      name: '김우주',
      email: 'es-wjkim@smilegate.com',
      passwordHash: wjkimPassword,
      role: 'ADMIN',
      teamStatus: 'AVAILABLE',
    },
  });
  console.log(`  김우주 ADMIN: ${wjkim.email} (id=${wjkim.id})`);

  const members = [
    { name: '김팀장', email: 'kim@qa.com',  role: 'QA_MANAGER', teamStatus: 'AVAILABLE' },
    { name: '이검증', email: 'lee@qa.com',  role: 'QA_MEMBER',  teamStatus: 'AVAILABLE' },
    { name: '박테스', email: 'park@qa.com', role: 'QA_MEMBER',  teamStatus: 'AVAILABLE' },
    { name: '최분석', email: 'choi@qa.com', role: 'QA_MEMBER',  teamStatus: 'AVAILABLE' },
  ];

  for (const m of members) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: { passwordHash: commonPassword },
      create: { ...m, passwordHash: commonPassword },
    });
  }
  console.log(`  Team members: ${members.length} upserted`);

  // ─────────────────────────────────────────────
  // 3. 프로젝트 4개
  // ─────────────────────────────────────────────
  const projects = [
    { name: 'Epicseven',             description: '에픽세븐',              color: '#3B82F6' },
    { name: 'Chaoszero Nightmare',   description: '카오스제로 나이트메어',  color: '#EF4444' },
    { name: 'Lordnine',             description: '로드나인',              color: '#10B981' },
    { name: 'Lordnine Asia',        description: '로드나인 아시아',        color: '#F59E0B' },
  ];

  for (const p of projects) {
    const existing = await prisma.project.findFirst({ where: { name: p.name, isDeleted: false } });
    if (!existing) {
      await prisma.project.create({
        data: {
          name: p.name,
          description: p.description,
          status: 'ACTIVE',
          color: p.color,
          createdBy: wjkim.id,
        },
      });
    } else {
      await prisma.project.update({
        where: { id: existing.id },
        data: { description: p.description, color: p.color },
      });
    }
  }
  console.log(`  Projects: ${projects.map(p => p.name).join(', ')}`);

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
